import { Suspense } from "react";
import { Editor } from "@/components/editor/Editor";
import { Loader2 } from "lucide-react";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen grid place-content-center bg-slate-100 text-slate-600">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading editor...</span>
          </div>
        </div>
      }
    >
      <Editor />
    </Suspense>
  );
}
