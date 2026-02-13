import { getSelectedFinderItems, showToast, Toast, Detail } from "@raycast/api";
import { useState, useEffect } from "react";
import FileList from "@/components/FileList";
import FileDetail from "@/components/FileDetail";

export default function Command() {
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFinderItems() {
      try {
        const items = await getSelectedFinderItems();

        if (items.length === 0) {
          await showToast({
            style: Toast.Style.Failure,
            title: "No files selected in Finder",
            message: "Select one or more files in Finder and try again",
          });
          setIsLoading(false);
          return;
        }

        setFilePaths(items.map((item) => item.path));
      } catch {
        await showToast({
          style: Toast.Style.Failure,
          title: "Cannot get Finder selection",
          message: "Make sure Finder is the frontmost app with files selected",
        });
      }

      setIsLoading(false);
    }

    loadFinderItems();
  }, []);

  if (isLoading) {
    return <Detail isLoading={true} markdown="" />;
  }

  if (filePaths.length === 0) {
    return (
      <Detail markdown="# No Files Selected\n\nSelect one or more files in Finder and try again." />
    );
  }

  if (filePaths.length === 1) {
    return <FileDetail filePath={filePaths[0]} />;
  }

  return <FileList filePaths={filePaths} />;
}
