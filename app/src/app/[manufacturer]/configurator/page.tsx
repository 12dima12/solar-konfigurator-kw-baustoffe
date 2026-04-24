import { notFound } from "next/navigation";
import { getManufacturer, listManufacturers } from "@/manufacturers";
import { ManufacturerProvider } from "@/lib/manufacturer-context";
import { ConfiguratorShell } from "@/components/configurator/ConfiguratorShell";
import { ConfiguratorErrorBoundary } from "@/components/configurator/ErrorBoundary";

interface Props {
  params: Promise<{ manufacturer: string }>;
}

export async function generateStaticParams() {
  return listManufacturers().map((m) => ({ manufacturer: m.meta.slug }));
}

export default async function ConfiguratorPage({ params }: Props) {
  const { manufacturer: slug } = await params;
  const manufacturer = getManufacturer(slug);
  if (!manufacturer) notFound();

  return (
    <ManufacturerProvider meta={manufacturer.meta} catalog={manufacturer.catalog}>
      <ConfiguratorErrorBoundary>
        <ConfiguratorShell />
      </ConfiguratorErrorBoundary>
    </ManufacturerProvider>
  );
}
