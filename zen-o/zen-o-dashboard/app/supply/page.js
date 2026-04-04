"use client";

import NavBar from "../../components/NavBar";
import dynamic from "next/dynamic";

const SupplyChain = dynamic(() => import("../../components/SupplyChain"), { ssr: false });

export default function SupplyPage() {
  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <NavBar />
      <main className="p-4 space-y-4 max-w-[1600px] mx-auto mt-4">
         <h1 className="text-lg font-mono font-bold text-gray-900 mb-2">Supply Chain Management</h1>
         <SupplyChain />
      </main>
    </div>
  );
}
