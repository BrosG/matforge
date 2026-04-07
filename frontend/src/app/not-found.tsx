"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Atom, ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="absolute top-32 -right-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-32 -left-32 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          className="text-center max-w-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8"
          >
            <Atom className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">
              <span className="text-gray-900">Mat</span>
              <span className="gradient-text">Forge</span>
            </span>
          </Link>

          {/* 404 number */}
          <motion.div
            className="text-[120px] sm:text-[160px] font-extrabold leading-none gradient-text mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            404
          </motion.div>

          <h1 className="text-2xl font-bold mb-3">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Perhaps you were looking for one of these?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/explore">
                <Search className="mr-2 h-4 w-4" />
                Explore Campaigns
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
