import { z } from 'zod'

const uuidLike = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

const stationEnum = z.enum(['Partida', 'Congelador', 'Camara', 'Timbre'])
const saleReasonEnum = z.enum(['merma', 'venta'])
const exitReasonEnum = z.enum(['accident', 'mal_estat', 'altre'])
const unitEnum = z.enum(['kg', 'L', 'raciones'])

const shelfLifeHours = z.union([
  z.number().gte(0).lte(720),
  z.null(),
])

export const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
})

export const logProductionSchema = z.object({
  productionId: uuidLike,
  quantity: z.number().gt(0).lte(999),
  shelfLifeHours: shelfLifeHours,
  batchNumber: z.string().min(1).max(5),
  station: stationEnum.nullable(),
})

export const createPrepSchema = z.object({
  name: z.string().trim().min(2).max(50),
  unit: unitEnum,
  shelf_life_hours: shelfLifeHours,
  station: stationEnum,
  recipe: z.string().nullable(),
  recipe_photos: z.array(z.string()),
})

export const updatePrepSchema = createPrepSchema.extend({
  id: uuidLike,
})

export const saleExitSchema = z.object({
  productionId: uuidLike,
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
  productionId: uuidLike,
  logIds: z.array(z.string()).nonempty(),
  targetStation: stationEnum,
  unfreezeExpiryHours: z.number().gt(0).optional(),
})

export const extendLotSchema = z.object({
  logId: uuidLike,
})

export const deletePhotoSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/\d+-[a-zA-Z0-9]+\.jpg$/),
})

export const suggestShelfLifeSchema = z.object({
  name: z.string().min(2).max(50),
})

export const deactivateSchema = z.object({
  id: uuidLike,
})

export const getRecipeSchema = z.object({
  productionId: uuidLike,
})
