import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        // Load theme from localStorage or default to "system"
        return localStorage.getItem("foxer-theme") || "system";
    });

    useEffect(() => {
        const applyTheme = (themeName) => {
            const root = document.documentElement;

            if (themeName === "system") {
                // Remove data-theme to let media queries work
                root.removeAttribute("data-theme");
            } else {
                // Set data-theme attribute
                root.setAttribute("data-theme", themeName);
            }
        };

        applyTheme(theme);
        localStorage.setItem("foxer-theme", theme);
    }, [theme]);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
