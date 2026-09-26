import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRolDto } from "./create-rol-dto";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() { return this.rolesService.findAll(); }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.rolesService.findOne(id); }

  @Post()
  create(@Body() dto: CreateRolDto) { return this.rolesService.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateRolDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.rolesService.remove(id); }
}