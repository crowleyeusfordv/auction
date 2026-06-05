import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { MantineProvider, createTheme } from "@mantine/core";
import "./index.css";
import App from "./App";

const theme = createTheme({
  primaryColor: 'red',
  primaryShade: 6,
});
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const queryClient = new QueryClient();


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
      <QueryClientProvider
        client={queryClient}
      >
        <MantineProvider theme={theme}>
          <App />
        </MantineProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  </BrowserRouter>
);

