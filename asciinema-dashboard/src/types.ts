import * as z from 'zod'

export const clientConfigSchema = z.object({
    fastforward: z.boolean().default(false),
    includeExited: z.boolean().default(false)
})
export type clientConfig = z.infer<typeof clientConfigSchema>

export const serverMessageSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("start"), 
        name: z.string(), 
        exited: z.boolean().default(false)
    }),
    z.object({
        action: z.literal("end"), 
        name: z.string()
    })
]);
export type serverMessage = z.infer<typeof serverMessageSchema>

export const clientMessageSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("start"), 
        options: clientConfigSchema
    }),
    z.object({
        action: z.literal("update"), 
        options: clientConfigSchema
    }),
]);
export type clientMessage = z.infer<typeof clientMessageSchema>

export const toptMessageSchema = z.object({
    otp: z.string(),
    expires: z.number()
})

export type toptMessage = z.infer<typeof toptMessageSchema>