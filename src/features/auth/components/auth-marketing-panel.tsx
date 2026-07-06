import authMarketingImage from "@/assets/auth-marketing-panel.png";

export function AuthMarketingPanel() {
  return (
    <section className="relative hidden h-screen overflow-auto lg:flex lg:flex-col lg:justify-center">
      <img
        alt="BooksWise — Smart Accounting. Simplified Growth."
        className="h-full w-full object-cover object-center"
        src={authMarketingImage}
      />
    </section>
  );
}
