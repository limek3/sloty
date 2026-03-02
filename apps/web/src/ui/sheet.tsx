import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Sheet(props: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {props.open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90]"
            style={{ background: "rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
          />
          <motion.div
            className="fixed left-0 right-0 bottom-0 z-[91]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="mx-auto max-w-md px-4 pb-4">
              <div className="glass rounded-[28px] overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{props.title ?? "Действие"}</div>
                    <button className="icon-btn" onClick={props.onClose} type="button" aria-label="Close">
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-5">{props.children}</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}