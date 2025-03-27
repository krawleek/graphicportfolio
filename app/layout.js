import "./Styles.css";

export const metadata = {
  title: "елена юнг",
  description: "мультидисциплинарная дизайнерка, которая делает брендинг первой свежести",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
