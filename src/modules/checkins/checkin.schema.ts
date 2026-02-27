// src/modules/checkins/checkin.schema.ts
import { z } from 'zod'

export const geolocationCheckInSchema = z.object({
  userLatitude: z.number({ message: 'Latitude é obrigatória' }),
  userLongitude: z.number({ message: 'Longitude é obrigatória' }),
})
export type GeolocationCheckInInput = z.infer<typeof geolocationCheckInSchema>