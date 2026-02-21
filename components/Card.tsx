"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActionSidebar } from "./ActionSidebar";
import type { Card as CardType, CardEvaluation } from "@/types";

interface CardProps {
  card: CardType;
  index: number;
  evaluation?: CardEvaluation | null;
  onCompress: (id: string) => void;
  onExpand: (id: string) => void;
  onRephrase: (id: string) => void;
  onInspect: (id: string) => void;
  onDismiss: (id: string) => void;
}

const VARIANT_COLORS: Record<string, string> = {
  compressed: "var(--action-compress)",
  expanded: "var(--action-expand)",
  rephrased: "var(--action-rephrase)",
};

const VARIANT_LABELS: Record<string, string> = {
  compressed: "↙ compressed",
  expanded: "↗ expanded",
  rephrased: "↺ rephrased",
};

export function Card({
  card,
  index,
  evaluation,
  onCompress,
  onExpand,
  onRephrase,
  onInspect,
  onDismiss,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
        delay: index * 0.22,
      }}
      style={{
        position: "relative",
        overflow: "visible",
        background: isHovered ? "var(--bg-card-hover)" : "var(--bg-card)",
        border: "1px solid var(--border-card)",
        borderRadius: 10,
        padding: "20px 24px",
        boxShadow: isHovered ? "var(--shadow-hover)" : "var(--shadow-idle)",
        transition: "box-shadow 0.2s, background 0.2s",
        cursor: "default",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => !card.loading && onRephrase(card.id)}
    >
      {/* Variant badge */}
      {card.variant !== "original" && VARIANT_LABELS[card.variant] && (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: 16,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: VARIANT_COLORS[card.variant],
            background: "var(--bg-card)",
            border: `1.5px solid ${VARIANT_COLORS[card.variant]}`,
            borderRadius: 10,
            padding: "2px 10px",
          }}
        >
          {VARIANT_LABELS[card.variant]}
        </span>
      )}

      {/* Evaluator strength dot */}
      {evaluation && (
        <>
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              zIndex: 5,
            }}
          >
            {/* Ping ring */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  evaluation.strength === "strong"
                    ? "var(--eval-strong)"
                    : evaluation.strength === "moderate"
                      ? "var(--eval-moderate)"
                      : "var(--eval-weak)",
                animation: "eval-ping 1.8s ease-out infinite",
                pointerEvents: "none",
              }}
            />
            {/* Dot */}
            <div
              title={evaluation.suggestion}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  evaluation.strength === "strong"
                    ? "var(--eval-strong)"
                    : evaluation.strength === "moderate"
                      ? "var(--eval-moderate)"
                      : "var(--eval-weak)",
                boxShadow:
                  evaluation.strength === "strong"
                    ? "0 0 4px 1px var(--eval-strong)"
                    : evaluation.strength === "moderate"
                      ? "0 0 4px 1px var(--eval-moderate)"
                      : "0 0 4px 1px var(--eval-weak)",
                animation: "eval-pulse 2s ease-in-out infinite",
                cursor: "help",
              }}
            />
          </div>
          {showTooltip && (
            <div
              style={{
                position: "absolute",
                top: -8,
                right: 20,
                transform: "translateY(-100%)",
                background: "var(--palette-bg)",
                color: "var(--palette-text)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 6,
                maxWidth: 240,
                lineHeight: 1.4,
                whiteSpace: "normal",
                zIndex: 20,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                pointerEvents: "none",
              }}
            >
              {evaluation.suggestion}
            </div>
          )}
        </>
      )}

      {/* Loading shimmer overlay */}
      {card.loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(160,146,128,0.08), transparent)",
              animation: "shimmer 1.2s linear infinite",
            }}
          />
        </div>
      )}

      {/* Card body text */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 15.5,
          lineHeight: 1.7,
          color: "var(--text-body)",
          opacity: card.loading ? 0.5 : 1,
          transition: "opacity 0.2s",
          pointerEvents: card.loading ? "none" : "auto",
          margin: 0,
        }}
      >
        {card.text}
      </p>

      {/* Inspect panel (shown when card.inspect is not null) */}
      {card.inspect && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px dashed var(--action-inspect)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              lineHeight: 1.6,
              color: "var(--action-inspect)",
              margin: 0,
            }}
          >
            {card.inspect}
          </p>
        </div>
      )}

      {/* Topic label */}
      {card.topic && (
        <span
          style={{
            display: "inline-block",
            marginTop: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-meta)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {card.topic}
        </span>
      )}

      {/* Action sidebar — shown on hover when not loading */}
      <AnimatePresence>
        {isHovered && !card.loading && (
          <ActionSidebar
            disabled={card.loading}
            onCompress={() => onCompress(card.id)}
            onExpand={() => onExpand(card.id)}
            onRephrase={() => onRephrase(card.id)}
            onInspect={() => onInspect(card.id)}
            onDismiss={() => onDismiss(card.id)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
