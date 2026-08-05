import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createUnitOfMeasure,
  getUnitsOfMeasure,
} from "@/features/items/api/units-of-measure.api";
import type { UnitOfMeasurePayload } from "@/features/items/types/unit-of-measure.types";
import { queryClient } from "@/lib/query/query-client";

export function useUnitsOfMeasure(enabled = true) {
  return useQuery({
    queryKey: ["units-of-measure"],
    queryFn: () => getUnitsOfMeasure(),
    enabled,
  });
}

export function useCreateUnitOfMeasure() {
  return useMutation({
    mutationFn: (payload: UnitOfMeasurePayload) => createUnitOfMeasure(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["units-of-measure"] });
    },
  });
}
