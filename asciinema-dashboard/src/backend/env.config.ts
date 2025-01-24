import z from 'zod';

// ENV variable schema
const envSchema = z.object({
    //AUTH_GOOGLE_SECRET: z.string().trim().min(1),
    //AUTH_GOOGLE_ID: z.string().trim().min(1),
    AUTH_GITHUB_SECRET: z.string().trim().min(1),
    AUTH_GITHUB_ID: z.string().trim().min(1),
    SRC_LOG_DIR: z.string().trim().min(1),
    AUTH_SECRET: z.string().trim().min(1), 
    JWT_SECRET: z.string().trim().min(1),
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    REDIS_HOST: z.string().trim().min(1),    
    REDIS_PASS: z.string().trim().min(1),
    ADMINS: z.string().regex(/^(?:[^,]+,)*$/).transform((val) =>val.split(',')).default('')
});
// Verify environment matches the schema
const envServer = envSchema.safeParse(process.env);

if (!envServer.success) {
    console.error(envServer.error.issues);
    throw new Error('There is an error with the server environment variables');
}
export const ENV = envSchema.parse(process.env)