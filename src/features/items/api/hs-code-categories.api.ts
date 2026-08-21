import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  HsCodeCategory,
  HsCodeCategoryPayload,
} from "@/features/items/types/hs-code-category.types";

export async function getHsCodeCategories(companyId: string) {
  const { data } = await apiClient.get<HsCodeCategory[]>(
    `/companies/${companyId}/hs-code-categories`,
  );
  return extractListData(data);
}

export async function createHsCodeCategory(companyId: string, payload: HsCodeCategoryPayload) {
  const { data } = await apiClient.post<HsCodeCategory>(
    `/companies/${companyId}/hs-code-categories`,
    payload,
  );
  return data;
}

export async function updateHsCodeCategory(
  companyId: string,
  hsCodeCategoryId: string,
  payload: Partial<HsCodeCategoryPayload>,
) {
  const { data } = await apiClient.patch<HsCodeCategory>(
    `/companies/${companyId}/hs-code-categories/${hsCodeCategoryId}`,
    payload,
  );
  return data;
}
