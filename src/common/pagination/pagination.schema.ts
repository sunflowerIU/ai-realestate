import z from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function toPagination(input: PaginationQuery) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    page: input.page,
    pageSize: input.pageSize,
  };
}
