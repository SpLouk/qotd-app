import { Stack } from "expo-router";
import { QueryProvider } from "@/providers/query";

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack />
    </QueryProvider>
  );
}
