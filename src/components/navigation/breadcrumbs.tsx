import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { companyNavigationGroups } from "@/components/navigation/navigation.config";

interface BreadcrumbsProps {
  companyId?: string;
  companyName?: string;
}

const segmentLabelMap = new Map(
  companyNavigationGroups.flatMap((group) =>
    group.items.map((item) => [item.segment, item.label] as const),
  ),
);

export function Breadcrumbs({ companyId, companyName }: BreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, segments) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;

      if (segment === "app") {
        return { label: "Workspace", href };
      }

      if (segment === "company" && companyId) {
        return { label: "Company", href: `/app/company/${companyId}` };
      }

      if (segment === companyId) {
        return { label: companyName ?? "Selected company", href };
      }

      if (segment === "companies") {
        return { label: "Companies", href };
      }

      return {
        label:
          segmentLabelMap.get(segment) ??
          segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        href,
      };
    });

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div className="flex items-center gap-2" key={item.href}>
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link className="transition hover:text-foreground" to={item.href}>
                {item.label}
              </Link>
            )}
            {!isLast ? <ChevronRight className="h-4 w-4" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
