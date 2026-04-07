"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RoundProgressProps {
  current: number;
  total: number;
  progress: number;
}

export function RoundProgress({ current, total, progress }: RoundProgressProps) {
  return (
    <Card className="mb-6 border-blue-100 bg-blue-50/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Campaign Running</h3>
              <p className="text-xs text-muted-foreground">
                Active learning round {current} of {total}
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">{progress}%</span>
        </div>

        <Progress value={progress} className="h-2.5 mb-3" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500" />

        {/* Round indicators */}
        {total <= 25 && (
          <div className="flex gap-1">
            {Array.from({ length: total }, (_, i) => (
              <motion.div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  i < current
                    ? "bg-blue-500"
                    : i === current
                      ? "bg-blue-400"
                      : "bg-gray-200"
                }`}
                initial={i === current ? { opacity: 0.5 } : {}}
                animate={
                  i === current
                    ? { opacity: [0.5, 1, 0.5] }
                    : {}
                }
                transition={
                  i === current
                    ? { duration: 1.5, repeat: Infinity }
                    : {}
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
