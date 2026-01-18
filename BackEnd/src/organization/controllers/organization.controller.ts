import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('organizations')
@UseGuards(AuthGuard) 
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  create(@Body() createDto: CreateOrganizationDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id; 
    return this.orgService.create(createDto, userId);
  }

  @Get('my-orgs')
  getMyOrgs(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.orgService.findAllForUser(userId);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.orgService.findOneBySlug(slug);
  }
}