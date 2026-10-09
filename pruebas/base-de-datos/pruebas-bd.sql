-- =====================================================================
-- PRUEBAS DE BASE DE DATOS  (Oracle, esquemas FRM_*)
-- Ejecutar como SYS en FREEPDB1:  .\pruebas\base-de-datos\ejecutar-pruebas-bd.ps1
--
-- NO destructivas: las pruebas que escriben datos lo hacen DENTRO de una
-- transaccion y la deshacen con ROLLBACK. Al terminar la base queda como estaba.
-- Cada linea de salida es PASA o FALLA.
-- =====================================================================
SET SERVEROUTPUT ON SIZE UNLIMITED
SET FEEDBACK OFF
SET LINESIZE 220

DECLARE
  v_ok    NUMBER := 0;
  v_fail  NUMBER := 0;
  n       NUMBER;
  v_id    NUMBER;
  v_cod   NUMBER;

  -- Registra el resultado de una prueba
  PROCEDURE prueba(p_id VARCHAR2, p_desc VARCHAR2, p_cond BOOLEAN, p_detalle VARCHAR2 DEFAULT NULL) IS
  BEGIN
    IF p_cond THEN
      v_ok := v_ok + 1;
      DBMS_OUTPUT.PUT_LINE('PASA   ' || RPAD(p_id, 5) || p_desc);
    ELSE
      v_fail := v_fail + 1;
      DBMS_OUTPUT.PUT_LINE('FALLA  ' || RPAD(p_id, 5) || p_desc || CASE WHEN p_detalle IS NOT NULL THEN '   -> ' || p_detalle END);
    END IF;
  END;

  -- Devuelve el resultado numerico de una consulta
  FUNCTION cuenta(p_sql VARCHAR2) RETURN NUMBER IS
    r NUMBER;
  BEGIN
    EXECUTE IMMEDIATE p_sql INTO r;
    RETURN r;
  END;
BEGIN
  DBMS_OUTPUT.PUT_LINE('===== A. ESTRUCTURA =====');

  n := cuenta('SELECT COUNT(*) FROM dba_users WHERE username LIKE ''FRM\_%'' ESCAPE ''\''');
  prueba('B01', 'existen los 9 esquemas FRM_*', n = 9, 'hay ' || n);

  n := cuenta('SELECT COUNT(*) FROM dba_tables WHERE owner LIKE ''FRM\_%'' ESCAPE ''\'' AND table_name NOT LIKE ''BIN$%''');
  prueba('B02', 'hay 52 tablas de negocio', n = 52, 'hay ' || n);

  n := cuenta('SELECT COUNT(*) FROM dba_constraints WHERE owner LIKE ''FRM\_%'' ESCAPE ''\'' AND constraint_type = ''R''');
  prueba('B03', 'hay 37 llaves foraneas', n = 37, 'hay ' || n);

  n := cuenta('SELECT COUNT(*) FROM dba_objects WHERE owner LIKE ''FRM\_%'' ESCAPE ''\'' AND object_type = ''PROCEDURE''');
  prueba('B04', 'hay 5 procedimientos almacenados', n = 5, 'hay ' || n);

  n := cuenta('SELECT COUNT(*) FROM dba_objects WHERE owner LIKE ''FRM\_%'' ESCAPE ''\'' AND status = ''INVALID''');
  prueba('B05', 'ningun objeto esta INVALID', n = 0, n || ' invalido(s)');

  n := cuenta('SELECT COUNT(*) FROM dba_tab_identity_cols WHERE owner LIKE ''FRM\_%'' ESCAPE ''\'' AND generation_type <> ''BY DEFAULT''');
  prueba('B06', 'todos los ids autonumericos son BY DEFAULT (permiten cargar ids propios)', n = 0, n || ' distinto(s)');

  DBMS_OUTPUT.PUT_LINE('===== B. BITACORA: COBERTURA =====');

  n := cuenta('SELECT COUNT(*) FROM dba_triggers WHERE trigger_name LIKE ''TRG\_AUDIT\_%'' ESCAPE ''\'' AND status = ''ENABLED''');
  prueba('B10', '40 triggers de bitacora ACTIVOS', n = 40, 'hay ' || n);

  n := cuenta('SELECT COUNT(*) FROM dba_triggers WHERE trigger_name LIKE ''TRG\_AUDIT\_%'' ESCAPE ''\'' AND status <> ''ENABLED''');
  prueba('B11', 'ningun trigger de bitacora esta deshabilitado', n = 0, n || ' deshabilitado(s)');

  n := cuenta('SELECT COUNT(*) FROM dba_tab_privs WHERE owner = ''FRM_AUDIT'' AND table_name = ''BITACORA_LOCAL'' AND privilege = ''INSERT'' ' ||
              'AND grantee IN (''FRM_USERS'',''FRM_INVENTORY'',''FRM_POS'',''FRM_BILLING'',''FRM_CASH'',''FRM_ASSETS'',''FRM_PAYROLL'',''FRM_DELIVERY'')');
  prueba('B12', 'los 8 esquemas de negocio pueden escribir en la bitacora', n = 8, 'solo ' || n);

  n := cuenta('SELECT COUNT(*) FROM FRM_AUDIT.SYNC_CONTROL WHERE destino = ''SQLSERVER_AUDITDB''');
  prueba('B13', 'existe el control de sincronizacion hacia SQL Server', n = 1);

  DBMS_OUTPUT.PUT_LINE('===== C. BITACORA: COMPORTAMIENTO (con ROLLBACK) =====');

  -- El usuario de la aplicacion queda registrado
  DBMS_SESSION.SET_IDENTIFIER('PRUEBA-C1');
  UPDATE FRM_USERS.REGION SET nombre = nombre WHERE region_id = (SELECT MIN(region_id) FROM FRM_USERS.REGION);
  n := cuenta('SELECT COUNT(*) FROM FRM_AUDIT.BITACORA_LOCAL WHERE usuario_app = ''PRUEBA-C1'' AND tabla = ''REGION'' AND operacion = ''UPDATE''');
  prueba('B20', 'un UPDATE queda en la bitacora con el usuario de la aplicacion', n = 1, 'filas=' || n);
  ROLLBACK;

  -- Sin identificador, usuario_app queda vacio (proceso automatico)
  DBMS_SESSION.CLEAR_IDENTIFIER;
  UPDATE FRM_USERS.REGION SET nombre = nombre WHERE region_id = (SELECT MIN(region_id) FROM FRM_USERS.REGION);
  n := cuenta('SELECT COUNT(*) FROM FRM_AUDIT.BITACORA_LOCAL WHERE usuario_app IS NULL AND tabla = ''REGION'' AND fecha_evento > SYSTIMESTAMP - INTERVAL ''1'' MINUTE');
  prueba('B21', 'sin usuario de aplicacion, usuario_app queda NULL (Sistema)', n >= 1);
  ROLLBACK;

  -- Nunca se guardan claves en la bitacora
  UPDATE FRM_USERS.USUARIO SET nombre = nombre WHERE usuario_id = (SELECT MIN(usuario_id) FROM FRM_USERS.USUARIO);
  n := cuenta('SELECT COUNT(*) FROM FRM_AUDIT.BITACORA_LOCAL WHERE tabla = ''USUARIO'' AND fecha_evento > SYSTIMESTAMP - INTERVAL ''1'' MINUTE ' ||
              'AND (LOWER(valores_nuevos) LIKE ''%password%'' OR valores_nuevos LIKE ''%$2b$%'' OR LOWER(valores_anteriores) LIKE ''%password%'')');
  prueba('B22', 'la bitacora de USUARIO NO contiene la clave ni su hash', n = 0, n || ' fila(s) con clave');
  ROLLBACK;

  -- Llave compuesta: queda como 1-23
  DELETE FROM FRM_USERS.ROL_PERMISO WHERE ROWNUM = 1;
  n := cuenta('SELECT COUNT(*) FROM FRM_AUDIT.BITACORA_LOCAL WHERE tabla = ''ROL_PERMISO'' AND operacion = ''DELETE'' ' ||
              'AND REGEXP_LIKE(clave_pk, ''^[0-9]+-[0-9]+$'') AND fecha_evento > SYSTIMESTAMP - INTERVAL ''1'' MINUTE');
  prueba('B23', 'una llave compuesta se guarda como "rol-permiso" (ej. 1-5)', n >= 1);
  ROLLBACK;

  -- Planilla tambien se audita
  UPDATE FRM_PAYROLL.EMPLEADO SET nombre = nombre WHERE ROWNUM = 1;
  n := cuenta('SELECT COUNT(*) FROM FRM_AUDIT.BITACORA_LOCAL WHERE origen_esquema = ''FRM_PAYROLL'' AND tabla = ''EMPLEADO'' AND fecha_evento > SYSTIMESTAMP - INTERVAL ''1'' MINUTE');
  prueba('B24', 'los cambios de planilla (EMPLEADO) quedan en la bitacora', n >= 1);
  ROLLBACK;

  DBMS_OUTPUT.PUT_LINE('===== D. REGLAS DE LA BASE (restricciones) =====');

  -- Hallazgos: el estado RESUELTO es valido, uno inventado no
  INSERT INTO FRM_AUDIT.HALLAZGO (tipo, severidad, descripcion, estado, creado_en)
  VALUES ('PRUEBA', 'BAJA', 'hallazgo de prueba', 'ABIERTO', SYSTIMESTAMP) RETURNING hallazgo_id INTO v_id;
  UPDATE FRM_AUDIT.HALLAZGO SET estado = 'RESUELTO' WHERE hallazgo_id = v_id;
  n := cuenta('SELECT COUNT(*) FROM FRM_AUDIT.HALLAZGO WHERE hallazgo_id = ' || v_id || ' AND estado = ''RESUELTO''');
  prueba('B30', 'un hallazgo se puede marcar RESUELTO', n = 1);
  BEGIN
    UPDATE FRM_AUDIT.HALLAZGO SET estado = 'INVENTADO' WHERE hallazgo_id = v_id;
    prueba('B31', 'un estado de hallazgo inventado se rechaza', FALSE, 'se acepto');
  EXCEPTION WHEN OTHERS THEN
    prueba('B31', 'un estado de hallazgo inventado se rechaza (ORA-02290)', SQLCODE = -2290, 'codigo ' || SQLCODE);
  END;
  ROLLBACK;

  -- Consolidados: un solo registro por sucursal y dia
  INSERT INTO FRM_AUDIT.CONSOLIDADO_VENTAS (fecha, region_id, sucursal_id, total_ventas, num_ventas) VALUES (DATE '2000-01-01', 1, 999, 0, 0);
  BEGIN
    INSERT INTO FRM_AUDIT.CONSOLIDADO_VENTAS (fecha, region_id, sucursal_id, total_ventas, num_ventas) VALUES (DATE '2000-01-01', 1, 999, 0, 0);
    prueba('B32', 'no se puede consolidar dos veces la misma sucursal y dia', FALSE, 'se acepto el duplicado');
  EXCEPTION WHEN OTHERS THEN
    prueba('B32', 'no se puede consolidar dos veces la misma sucursal y dia (ORA-00001)', SQLCODE = -1, 'codigo ' || SQLCODE);
  END;
  ROLLBACK;

  -- Planilla: una por sucursal y periodo; pagos validos
  INSERT INTO FRM_PAYROLL.PLANILLA (periodo, sucursal_id, total_pagado, estado) VALUES ('9999-12', 999, 0, 'ABIERTA') RETURNING planilla_id INTO v_id;
  BEGIN
    INSERT INTO FRM_PAYROLL.PLANILLA (periodo, sucursal_id, total_pagado, estado) VALUES ('9999-12', 999, 0, 'ABIERTA');
    prueba('B33', 'una sola planilla por sucursal y periodo', FALSE, 'se acepto el duplicado');
  EXCEPTION WHEN OTHERS THEN
    prueba('B33', 'una sola planilla por sucursal y periodo (ORA-00001)', SQLCODE = -1, 'codigo ' || SQLCODE);
  END;

  INSERT INTO FRM_PAYROLL.EMPLEADO (codigo, nombre, sucursal_id, activo) VALUES ('T-PRUEBA', 'Empleado de prueba', 999, 1) RETURNING empleado_id INTO v_cod;
  BEGIN
    INSERT INTO FRM_PAYROLL.PAGO_PLANILLA (planilla_id, empleado_id, fecha_pago, tipo, monto_pagado) VALUES (v_id, v_cod, SYSDATE, 'SALARIO', -5);
    prueba('B34', 'no se acepta un pago con monto negativo', FALSE, 'se acepto');
  EXCEPTION WHEN OTHERS THEN
    prueba('B34', 'no se acepta un pago con monto negativo (ORA-02290)', SQLCODE = -2290, 'codigo ' || SQLCODE);
  END;
  BEGIN
    INSERT INTO FRM_PAYROLL.PAGO_PLANILLA (planilla_id, empleado_id, fecha_pago, tipo, monto_pagado) VALUES (v_id, v_cod, SYSDATE, 'REGALO', 5);
    prueba('B35', 'el tipo de pago solo puede ser SALARIO, BONO u OTRO', FALSE, 'se acepto REGALO');
  EXCEPTION WHEN OTHERS THEN
    prueba('B35', 'el tipo de pago solo puede ser SALARIO, BONO u OTRO (ORA-02290)', SQLCODE = -2290, 'codigo ' || SQLCODE);
  END;
  BEGIN
    INSERT INTO FRM_PAYROLL.EMPLEADO (codigo, nombre, sucursal_id, activo) VALUES ('T-PRUEBA', 'Otro', 999, 1);
    prueba('B36', 'el codigo de empleado no se repite', FALSE, 'se acepto el duplicado');
  EXCEPTION WHEN OTHERS THEN
    prueba('B36', 'el codigo de empleado no se repite (ORA-00001)', SQLCODE = -1, 'codigo ' || SQLCODE);
  END;
  ROLLBACK;

  DBMS_OUTPUT.PUT_LINE('===== E. PERMISOS DEL SISTEMA (datos) =====');

  -- El gateway exige estos permisos para traslados; si no existen, nadie (salvo SUPERADMIN) puede usarlos
  n := cuenta('SELECT COUNT(*) FROM FRM_USERS.PERMISO WHERE codigo IN (''TRASLADO_VER'',''TRASLADO_SOLICITAR'',''TRASLADO_AUTORIZAR'',''TRASLADO_RECIBIR'')');
  prueba('B40', 'existen los 4 permisos de traslados (VER, SOLICITAR, AUTORIZAR, RECIBIR)', n = 4,
         'solo existen ' || n || ' de 4: crea TRASLADO_SOLICITAR y TRASLADO_RECIBIR (ver docs/PLAN-DE-PRUEBAS.md)');

  n := cuenta('SELECT COUNT(*) FROM FRM_USERS.PERMISO WHERE codigo IN (''AUDITORIA_VER'',''AUDITORIA_RESOLVER'',''PLANILLA_GESTIONAR'',''ACTIVOS_GESTIONAR'')');
  prueba('B41', 'existen los permisos de auditoria, planilla y activos', n = 4, 'solo ' || n || ' de 4');

  n := cuenta('SELECT COUNT(*) FROM FRM_USERS.ROL r WHERE r.nombre = ''Super Administrador'' ' ||
              'AND (SELECT COUNT(*) FROM FRM_USERS.ROL_PERMISO rp WHERE rp.rol_id = r.rol_id) = (SELECT COUNT(*) FROM FRM_USERS.PERMISO)');
  prueba('B42', 'el rol Super Administrador tiene TODOS los permisos', n = 1, 'le faltan permisos por asignar');

  n := cuenta('SELECT COUNT(*) FROM FRM_USERS.USUARIO u WHERE NOT EXISTS (SELECT 1 FROM FRM_USERS.USUARIO_ROL ur WHERE ur.usuario_id = u.usuario_id)');
  prueba('B43', 'todo usuario tiene al menos un rol', n = 0, n || ' usuario(s) sin rol');

  n := cuenta('SELECT COUNT(*) FROM FRM_USERS.USUARIO u WHERE u.activo = 1 AND NOT EXISTS (SELECT 1 FROM FRM_USERS.USUARIO_SUCURSAL us WHERE us.usuario_id = u.usuario_id)');
  prueba('B44', 'todo usuario activo tiene al menos una sucursal asignada', n = 0, n || ' usuario(s) sin sucursal');

  DBMS_OUTPUT.PUT_LINE('--------------------------------------------------------------');
  DBMS_OUTPUT.PUT_LINE('RESUMEN: ' || v_ok || ' pasan, ' || v_fail || ' fallan, ' || (v_ok + v_fail) || ' en total');
  DBMS_SESSION.CLEAR_IDENTIFIER;
END;
/
EXIT
