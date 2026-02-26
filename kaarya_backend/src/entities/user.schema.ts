import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { AuthProvider } from 'src/types/auth-provider.enum';
import type {
  TCandidateCertificationItem,
  TCandidateEducationItem,
  TCandidateExperienceItem,
  TCandidateProfile,
  TCandidateSalary,
} from 'src/types/candidate-profile.type';
import { UserRole } from 'src/types/user-role.enum';

export type UserSchemaDocument = HydratedDocument<UserSchemaClass>;

type TCandidateProfileDocument = Omit<
  TCandidateProfile,
  'education' | 'experience' | 'certifications' | 'salary'
> & {
  education?: TCandidateEducationItem[];
  experience?: TCandidateExperienceItem[];
  certifications?: TCandidateCertificationItem[];
  salary?: TCandidateSalary;
};

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class UserSchemaClass {
  @Prop({
    type: String,
    unique: true,
    lowercase: true,
  })
  email: string | null;

  @Prop({ select: false })
  password?: string;

  @Prop({ type: Date, default: null })
  passwordChangedAt?: Date | null;

  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    default: AuthProvider.EMAIL,
  })
  provider: AuthProvider;

  @Prop({
    type: String,
  })
  socialId?: string | null;

  @Prop({
    type: String,
  })
  name: string | null;

  @Prop({
    type: String,
  })
  photo?: string | null;

  @Prop({
    type: {
      headline: { type: String, default: null },
      phone: { type: String, default: null },
      location: { type: String, default: null },
      summary: { type: String, default: null },
      portfolioUrl: { type: String, default: null },
      linkedinUrl: { type: String, default: null },
      githubUrl: { type: String, default: null },
      preferredRoles: {
        type: [String],
        default: [],
      },
      preferredLocations: {
        type: [String],
        default: [],
      },
      preferredWorkModes: {
        type: [String],
        default: [],
      },
      skills: {
        type: [String],
        default: [],
      },
      education: {
        type: [
          {
            _id: false,
            id: { type: String, required: true },
            institution: { type: String, required: true },
            degree: { type: String, required: true },
            fieldOfStudy: { type: String, default: null },
            startDate: { type: String, default: null },
            endDate: { type: String, default: null },
            grade: { type: String, default: null },
            description: { type: String, default: null },
          },
        ],
        default: [],
      },
      experience: {
        type: [
          {
            _id: false,
            id: { type: String, required: true },
            jobTitle: { type: String, required: true },
            companyName: { type: String, required: true },
            location: { type: String, default: null },
            employmentType: { type: String, default: null },
            startDate: { type: String, default: null },
            endDate: { type: String, default: null },
            currentlyWorking: { type: Boolean, default: false },
            description: { type: String, default: null },
          },
        ],
        default: [],
      },
      certifications: {
        type: [
          {
            _id: false,
            id: { type: String, required: true },
            name: { type: String, required: true },
            issuer: { type: String, required: true },
            issueDate: { type: String, default: null },
            expiryDate: { type: String, default: null },
            credentialId: { type: String, default: null },
            credentialUrl: { type: String, default: null },
            mediaUrl: { type: String, default: null },
            mediaMimeType: { type: String, default: null },
            noExpiry: { type: Boolean, default: false },
          },
        ],
        default: [],
      },
      salary: {
        currency: { type: String, default: null },
        minAmount: { type: Number, default: null },
        maxAmount: { type: Number, default: null },
        period: { type: String, default: null },
        isNegotiable: { type: Boolean, default: false },
      },
      defaultResumeId: { type: String, default: null },
      portfolioLinks: {
        type: [String],
        default: [],
      },
      openToWork: { type: Boolean, default: true },
    },
    default: {},
  })
  candidateProfile?: TCandidateProfileDocument;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserSchemaClass);

UserSchema.index({ role: 1 });
