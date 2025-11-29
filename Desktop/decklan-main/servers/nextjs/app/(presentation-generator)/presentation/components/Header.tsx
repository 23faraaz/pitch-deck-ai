"use client";
import { Button } from "@/components/ui/button";
import {
  SquareArrowOutUpRight,
  Play,
  Loader2,
  Redo2,
  Undo2,

} from "lucide-react";
import React, { useState } from "react";
import Wrapper from "@/components/Wrapper";
import { useRouter, usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PresentationGenerationApi } from "../../services/api/presentation-generation";
import { OverlayLoader } from "@/components/ui/overlay-loader";
import { useDispatch, useSelector } from "react-redux";

import Link from "next/link";

import { RootState } from "@/store/store";
import { toast } from "sonner";


import Announcement from "@/components/Announcement";
import { PptxPresentationModel } from "@/types/pptx_models";
import HeaderNav from "../../components/HeaderNab";
import PDFIMAGE from "@/public/pdf.svg";
import PPTXIMAGE from "@/public/pptx.svg";
import Image from "next/image";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { usePresentationUndoRedo } from "../hooks/PresentationUndoRedo";
import ToolTip from "@/components/ToolTip";
import { clearPresentationData } from "@/store/slices/presentationGeneration";
import { clearHistory } from "@/store/slices/undoRedoSlice";

const Header = ({
  presentation_id,
  currentSlide,
}: {
  presentation_id: string;
  currentSlide?: number;
}) => {
  const [open, setOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();


  const { presentationData, isStreaming } = useSelector(
    (state: RootState) => state.presentationGeneration
  );

  const { onUndo, onRedo, canUndo, canRedo } = usePresentationUndoRedo();

  // Convert file system path to URL path for nginx static file serving
  const convertToUrlPath = (filePath: string): string => {
    // Normalize path separators
    let urlPath = filePath.replace(/\\/g, '/');
    
    // If it's already a relative path starting with /app_data/exports/, use it as-is
    if (urlPath.startsWith('/app_data/exports/')) {
      return urlPath;
    } else if (urlPath.includes('/app_data/exports/')) {
      // Extract everything from /app_data/exports/ onwards
      const match = urlPath.match(/\/app_data\/exports\/(.+)$/);
      if (match) {
        return `/app_data/exports/${match[1]}`;
      }
    } else if (urlPath.includes('exports')) {
      // Extract path after 'exports' directory
      const parts = urlPath.split('exports');
      if (parts.length > 1) {
        const afterExports = parts[parts.length - 1].replace(/^[\/\\]+/, '');
        return `/app_data/exports/${afterExports}`;
      }
    }
    
    // Fallback: extract just the filename
    const filename = urlPath.split('/').pop() || urlPath.split('\\').pop();
    if (filename) {
      return `/app_data/exports/${filename}`;
    }
    
    return urlPath;
  };

  const get_presentation_pptx_model = async (id: string): Promise<PptxPresentationModel> => {
    const response = await fetch(`/api/presentation_to_pptx_model?id=${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
      throw new Error(errorData.detail || errorData.message || `Failed to get presentation PPTX model: ${response.status}`);
    }
    const pptx_model = await response.json();
    return pptx_model;
  };

  const handleExportPptx = async () => {
    if (isStreaming) return;

    try {
      setOpen(false);
      setShowLoader(true);
      // Save the presentation data before exporting
      trackEvent(MixpanelEvent.Header_UpdatePresentationContent_API_Call);
      await PresentationGenerationApi.updatePresentationContent(presentationData);
      trackEvent(MixpanelEvent.Header_GetPptxModel_API_Call);
      const pptx_model = await get_presentation_pptx_model(presentation_id);
      if (!pptx_model) {
        throw new Error("Failed to get presentation PPTX model");
      }
      trackEvent(MixpanelEvent.Header_ExportAsPPTX_API_Call);
      const pptx_path = await PresentationGenerationApi.exportAsPPTX(pptx_model);
      if (pptx_path) {
        // Use the download API endpoint instead of direct file access
        const downloadUrl = `/api/download-export?path=${encodeURIComponent(pptx_path)}`;
        await downloadLink(downloadUrl);
      } else {
        throw new Error("No path returned from export");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Export failed:", errorMessage, error);
      setShowLoader(false);
      toast.error("Having trouble exporting!", {
        description: errorMessage || "We are having trouble exporting your presentation. Please try again.",
      });
    } finally {
      setShowLoader(false);
    }
  };

  const handleExportPdf = async () => {
    if (isStreaming) return;

    try {
      setOpen(false);
      setShowLoader(true);
      // Save the presentation data before exporting
      trackEvent(MixpanelEvent.Header_UpdatePresentationContent_API_Call);
      await PresentationGenerationApi.updatePresentationContent(presentationData);

      trackEvent(MixpanelEvent.Header_ExportAsPDF_API_Call);
      const response = await fetch('/api/export-as-pdf', {
        method: 'POST',
        body: JSON.stringify({
          id: presentation_id,
          title: presentationData?.title,
        })
      });

      if (response.ok) {
        const { path: pdfPath } = await response.json();
        // Use the download API endpoint instead of direct file access
        const downloadUrl = `/api/download-export?path=${encodeURIComponent(pdfPath)}`;
        await downloadLink(downloadUrl);
      } else {
        throw new Error("Failed to export PDF");
      }

    } catch (err) {
      console.error(err);
      toast.error("Having trouble exporting!", {
        description:
          "We are having trouble exporting your presentation. Please try again.",
      });
    } finally {
      setShowLoader(false);
    }
  };
  const handleReGenerate = () => {
    dispatch(clearPresentationData());
    dispatch(clearHistory())
    trackEvent(MixpanelEvent.Header_ReGenerate_Button_Clicked, { pathname });
    router.push(`/presentation?id=${presentation_id}&stream=true`);
  };
  const downloadLink = async (url: string) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Extract filename from Content-Disposition header or URL
      let filename = 'download';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          // Decode URI if needed
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // If decoding fails, use as-is
          }
        }
      } else {
        // Fallback to extracting from URL
        filename = url.split('/').pop()?.split('?')[0] || 'download';
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to opening in new window
      window.open(url, '_blank');
    }
  };

  const ExportOptions = ({ mobile }: { mobile: boolean }) => (
    <div className={`space-y-2 max-md:mt-4 ${mobile ? "" : "bg-white"} rounded-lg`}>
      <Button
        onClick={() => {
          trackEvent(MixpanelEvent.Header_Export_PDF_Button_Clicked, { pathname });
          handleExportPdf();
        }}
        variant="ghost"
        className={`pb-4 border-b rounded-none border-gray-300 w-full flex justify-start text-[#5146E5] ${mobile ? "bg-white py-6 border-none rounded-lg" : ""}`} >
        <Image src={PDFIMAGE} alt="pdf export" width={30} height={30} />
        Export as PDF
      </Button>
      <Button
        onClick={() => {
          trackEvent(MixpanelEvent.Header_Export_PPTX_Button_Clicked, { pathname });
          handleExportPptx();
        }}
        variant="ghost"
        className={`w-full flex justify-start text-[#5146E5] ${mobile ? "bg-white py-6" : ""}`}
      >
        <Image src={PPTXIMAGE} alt="pptx export" width={30} height={30} />
        Export as PPTX
      </Button>


    </div>
  );

  const MenuItems = ({ mobile }: { mobile: boolean }) => (
    <div className="flex flex-col lg:flex-row items-center gap-4">
      {/* undo redo */}
      <button onClick={handleReGenerate} disabled={isStreaming || !presentationData} className="text-white  disabled:opacity-50" >

        Re-Generate
      </button>
      <div className="flex items-center gap-2 ">
        <ToolTip content="Undo">
          <button disabled={!canUndo} className="text-white disabled:opacity-50" onClick={() => {
            onUndo();
          }}>

            <Undo2 className="w-6 h-6 " />

          </button>
        </ToolTip>
        <ToolTip content="Redo">

          <button disabled={!canRedo} className="text-white disabled:opacity-50" onClick={() => {
            onRedo();
          }}>
            <Redo2 className="w-6 h-6 " />

          </button>
        </ToolTip>

      </div>

      {/* Present Button */}
      <Button
        onClick={() => {
          const to = `?id=${presentation_id}&mode=present&slide=${currentSlide || 0}`;
          trackEvent(MixpanelEvent.Navigation, { from: pathname, to });
          router.push(to);
        }}
        variant="ghost"
        className="border border-white font-bold text-white rounded-[32px] transition-all duration-300 group"
      >
        <Play className="w-4 h-4 mr-1 stroke-white group-hover:stroke-black" />
        Present
      </Button>

      {/* Desktop Export Button with Popover */}

      <div style={{
        zIndex: 100
      }} className="hidden lg:block relative ">
        <Popover open={open} onOpenChange={setOpen} >
          <PopoverTrigger asChild>
            <Button className={`border py-5 text-[#5146E5] font-bold rounded-[32px] transition-all duration-500 hover:border hover:bg-[#5146E5] hover:text-white w-full ${mobile ? "" : "bg-white"}`}>
              <SquareArrowOutUpRight className="w-4 h-4 mr-1" />
              Export
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[250px] space-y-2 py-3 px-2 ">
            <ExportOptions mobile={false} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Export Section */}
      <div className="lg:hidden flex flex-col w-full">
        <ExportOptions mobile={true} />
      </div>
    </div>
  );

  return (
    <>
      <OverlayLoader
        show={showLoader}
        text="Exporting presentation..."
        showProgress={true}
        duration={40}
      />
      <div

        className="bg-black w-full shadow-lg sticky top-0 ">

        <Announcement />
        <Wrapper className="flex items-center justify-between py-1">
          <Link href="/dashboard" className="min-w-[162px]">
            <img
              className="h-16"
              src="/logo-white.png"
              alt="Presentation logo"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4 2xl:gap-6">
            {isStreaming && (
              <Loader2 className="animate-spin text-white font-bold w-6 h-6" />
            )}


            <MenuItems mobile={false} />
            <HeaderNav />
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center gap-4">
            <HeaderNav />

          </div>
        </Wrapper>

      </div>
    </>
  );
};

export default Header;
