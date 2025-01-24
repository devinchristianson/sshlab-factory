import ToolBar from "./components/ToolBar";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import Dashboard from "./pages/Dashboard";
import Wiki from "./pages/Wiki";
import { trpc } from "./utils";
import { useState } from "react";
import Test from "./pages/Test";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${window.location.origin}/api`,
          async headers() {
            return {};
          },
        }),
      ],
    }),
  );
  return <div className="min-h-full flex flex-col bg-gray-800">
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <ToolBar/>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/wiki/:identifier+" element={<Wiki />} />
            <Route path="/test" element={<Test/>}/>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  </div>
}
/*
const routes = [
  { path: '/', component: Dashboard },
  { path: '/intro', component: Intro },
  { path: '/wiki/:identifier+', component: Wiki },
]
*/
export default App
