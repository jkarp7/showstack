/**
 * Project Schema
 *
 * Validation schema for ShowStack project entities
 */

import { z } from 'zod';
import { extendBaseEntity } from '../base';

/**
 * Email validation (optional)
 */
const OptionalEmailSchema = z.string().email().optional().or(z.literal(''));

/**
 * Phone validation (optional, flexible format)
 */
const OptionalPhoneSchema = z.string().optional();

/**
 * JSON array of strings (stored as string in database)
 */
const JSONStringArraySchema = z.string().optional();

/**
 * Project validation schema
 *
 * Validates all fields for a ShowStack project including:
 * - Basic metadata (name, description)
 * - Design team (lighting, audio, video)
 * - Production staff (electrician, PM, GM, etc.)
 * - Venue & dates
 * - Enabled modules
 */
export const ProjectSchema = extendBaseEntity({
  // Basic metadata (required)
  name: z.string().min(1, 'Project name is required'),

  // Basic metadata (optional)
  description: z.string().optional(),
  logo_path: z.string().optional(),
  enabled_modules: JSONStringArraySchema,

  // Design Team - Lighting
  lighting_designer: z.string().optional(),
  lighting_designer_email: OptionalEmailSchema,
  lighting_designer_phone: OptionalPhoneSchema,
  lighting_associates: JSONStringArraySchema,

  // Design Team - Audio
  audio_designer: z.string().optional(),
  audio_designer_email: OptionalEmailSchema,
  audio_designer_phone: OptionalPhoneSchema,
  audio_associates: JSONStringArraySchema,

  // Design Team - Video
  video_designer: z.string().optional(),
  video_designer_email: OptionalEmailSchema,
  video_designer_phone: OptionalPhoneSchema,
  video_associates: JSONStringArraySchema,

  // Production Staff - Electrician
  electrician: z.string().optional(),
  electrician_email: OptionalEmailSchema,
  electrician_phone: OptionalPhoneSchema,

  // Production Staff - Audio Tech
  audio_tech: z.string().optional(),
  audio_tech_email: OptionalEmailSchema,
  audio_tech_phone: OptionalPhoneSchema,

  // Production Staff - Video Tech
  video_tech: z.string().optional(),
  video_tech_email: OptionalEmailSchema,
  video_tech_phone: OptionalPhoneSchema,

  // Production Staff - Production Manager
  production_manager: z.string().optional(),
  production_manager_email: OptionalEmailSchema,
  production_manager_phone: OptionalPhoneSchema,
  production_manager_company: z.string().optional(),

  // Production Staff - General Manager
  general_manager: z.string().optional(),
  general_manager_email: OptionalEmailSchema,
  general_manager_phone: OptionalPhoneSchema,
  general_manager_company: z.string().optional(),

  // Venue & Dates
  venue: z.string().optional(),
  venue_city: z.string().optional(),
  venue_state: z.string().optional(),
  show_dates: JSONStringArraySchema,
});

/**
 * Project type (inferred from schema)
 */
export type Project = z.infer<typeof ProjectSchema>;

/**
 * Schema for creating a new project (without id and timestamps)
 */
export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Schema for updating a project (all fields optional except id)
 */
export const UpdateProjectSchema = ProjectSchema.partial().required({ id: true });

/**
 * Create project type
 */
export type CreateProject = z.infer<typeof CreateProjectSchema>;

/**
 * Update project type
 */
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
