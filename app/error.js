"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("APP_ERROR_BOUNDARY:", error);
    }, [error]);

    return (
        <div style={{ padding: "40px", textAlign: "center", color: "#fff" }}>
            <h2 style={{ color: "#ef4444" }}>Algo deu errado!</h2>
            <p style={{ marginBottom: "20px" }}>
                Não conseguimos carregar a página inicial.
                <br />
                <small style={{ color: "#888" }}>
                    Código: {error.digest || "Sem digest"}
                </small>
                <br />
                <small style={{ color: "#888" }}>
                    Mensagem: {error.message}
                </small>
            </p>

            <div style={{ textAlign: "left", background: "#222", padding: "10px", margin: "20px auto", maxWidth: "600px", overflow: "auto" }}>
                <pre>{JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}</pre>
            </div>

            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                style={{
                    padding: "10px 20px",
                    background: "#22c55e",
                    border: "none",
                    borderRadius: "8px",
                    color: "#000",
                    fontWeight: "bold",
                    cursor: "pointer",
                }}
            >
                Tentar novamente
            </button>
        </div>
    );
}
