declare module "html-docx-js" {
  const htmlDocx: {
    asBlob(html: string, options?: { orientation?: "portrait" | "landscape"; margins?: Record<string, number> }): Blob;
  };
  export default htmlDocx;
}
