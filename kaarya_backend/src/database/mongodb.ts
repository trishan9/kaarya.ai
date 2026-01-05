import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './mongoose-config.service';

export const MongoDatabase = MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
