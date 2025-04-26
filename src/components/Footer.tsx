import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full border-t py-6 main-nav">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {currentYear} Stash Flow. All rights reserved.
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">Home</Link>
          <Link to="/classes" className="underline-offset-4 hover:underline">Classes</Link>
          <Link to="/settings" className="underline-offset-4 hover:underline">Settings</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer; 