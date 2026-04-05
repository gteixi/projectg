import { z } from 'zod'

const stationEnum = z.enum(['Partida', 'Congelador', 'Camara', 'Timbre'])
const saleReasonEnum = z.enum(['merma', 'venta'])
const exitReasonEnum = z.enum(['accident', 'mal_estat', 'altre'])
const unitEnum = z.enum(['kg', 'L', 'raciones'])

const shelfLifeHours = z.union([
  z.number().gt(0).lte(720),
  z.null(),
])

export const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
})

export const logProductionSchema = z.object({
  productionId: z.string().uuid(),
  quantity: z.number().gt(0).lte(10000),
  shelfLifeHours: shelfLifeHours,
  batchNumber: z.string().min(1).max(5),
  station: stationEnum.nullable(),
})

export const createPrepSchema = z.object({
  name: z.string().trim().min(2),
  unit: unitEnum,
  shelf_life_hours: shelfLifeHours,
  station: stationEnum,
  recipe: z.string().nullable(),
  recipe_photos: z.array(z.string()),
})

export const updatePrepSchema = createPrepSchema.extend({
  id: z.string().uuid(),
})

export const saleExitSchema = z.object({
  productionId: z.string().uuid(),
  quantity: z.number().gt(0),
  reason: saleReasonEnum,
  lots: z.array(
    z.object({
      batch_number: z.string(),
      quantity: z.number().gt(0),
    })
  ),
  exitReason: exitReasonEnum.nullable(),
})

export const moveLotsSchema = z.object({
  productionId: z.string().uuid(),
  logIds: z.array(z.string()).nonempty(),
  targetStation: stationEnum,
  unfreezeExpiryHours: z.number().gt(0).optional(),
})

export const extendLotSchema = z.object({
  logId: z.string().uuid(),
})

export const deletePhotoSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/\d+-[a-zA-Z0-9]+\.jpg$/),
})

export const suggestShelfLifeSchema = z.object({
  name: z.string().min(2),
})

export const deactivateSchema = z.object({
  id: z.string().uuid(),
})

export const getRecipeSchema = z.object({
  productionId: z.string().uuid(),
})
