/** Triggers a browser download of a JSON string. */
export const saveJson = (json: string, fileName: string) => {
  const href = URL.createObjectURL(
    new Blob([json], { type: "application/json;charset=utf-8" }),
  );
  const link = Object.assign(document.createElement("a"), {
    href,
    download: fileName,
  });
  link.click();
  URL.revokeObjectURL(href);
};
