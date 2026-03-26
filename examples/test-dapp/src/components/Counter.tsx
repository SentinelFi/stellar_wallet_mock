import { Button, Card } from "@stellar/design-system"
import { useState } from "react"
import counter from "../contracts/counter"
import { useWallet } from "../hooks/useWallet"

export const Counter = () => {
	const { address, signTransaction } = useWallet()
	const [count, setCount] = useState<number | null>(null)
	const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")

	const handleIncrement = async () => {
		if (!address) return
		setStatus("loading")
		try {
			const tx = await counter.increment({
				// @ts-expect-error publicKey is allowed
				publicKey: address,
			})
			const { result } = await tx.signAndSend({ signTransaction })
			setCount(result)
			setStatus("idle")
		} catch (err) {
			console.error("Increment failed:", err)
			setStatus("error")
		}
	}

	const handleGetCount = async () => {
		try {
			const { result } = await counter.get_count()
			setCount(result)
		} catch (err) {
			console.error("Get count failed:", err)
		}
	}

	return (
		<Card>
			<h2>Counter Contract</h2>

			<p data-testid="counter-value">
				Current count: {count !== null ? count : "—"}
			</p>

			<div style={{ display: "flex", gap: "1rem" }}>
				<Button
					variant="primary"
					size="md"
					data-testid="increment-btn"
					disabled={!address || status === "loading"}
					onClick={handleIncrement}
				>
					{status === "loading" ? "Signing…" : "Increment"}
				</Button>

				<Button
					variant="secondary"
					size="md"
					data-testid="get-count-btn"
					onClick={handleGetCount}
				>
					Get Count
				</Button>
			</div>

			{status === "error" && (
				<p data-testid="counter-error" style={{ color: "red" }}>
					Transaction failed. Check console for details.
				</p>
			)}
		</Card>
	)
}
