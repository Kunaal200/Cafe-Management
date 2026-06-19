import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  businessDetailsSchema,
  localizationSchema,
  menuSeedSchema,
  outletSchema,
  subdomainCheckSchema,
  tablesSeedSchema,
  UserRole,
  type BusinessDetailsInput,
  type LocalizationInput,
  type MenuSeedInput,
  type OutletInput,
  type TablesSeedInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@ApiBearerAuth()
@Roles(UserRole.OWNER)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('check-subdomain')
  checkSubdomain(@Query(new ZodValidationPipe(subdomainCheckSchema)) query: { subdomain: string }) {
    return this.onboarding.isSubdomainAvailable(query.subdomain);
  }

  @Post('business')
  createBusiness(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(businessDetailsSchema)) body: BusinessDetailsInput,
  ) {
    return this.onboarding.createBusiness(userId, body);
  }

  @Post('outlet')
  createOutlet(@Body(new ZodValidationPipe(outletSchema)) body: OutletInput) {
    return this.onboarding.createOutlet(body);
  }

  @Post('outlets/:outletId/localization')
  setLocalization(
    @Param('outletId') outletId: string,
    @Body(new ZodValidationPipe(localizationSchema)) body: LocalizationInput,
  ) {
    return this.onboarding.setLocalization(outletId, body);
  }

  @Post('menu')
  seedMenu(@Body(new ZodValidationPipe(menuSeedSchema)) body: MenuSeedInput) {
    return this.onboarding.seedMenu(body);
  }

  @Post('outlets/:outletId/tables')
  seedTables(
    @Param('outletId') outletId: string,
    @Body(new ZodValidationPipe(tablesSeedSchema)) body: TablesSeedInput,
  ) {
    return this.onboarding.seedTables(outletId, body);
  }

  @Post('complete')
  complete() {
    return this.onboarding.complete();
  }
}
