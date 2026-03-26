import { Button, Card, Input } from "@stellar/design-system"
import { useState } from "react"
import vault from "../contracts/vault"
import { useWallet } from "../hooks/useWallet"

export const Vault = () => {
	const { address, signTransaction, updateBalances } = useWallet()
	const [depositAmount, setDepositAmount] = useState("")
	const [withdrawAmount, setWithdrawAmount] = useState("")
	const [vaultBalance, setVaultBalance] = useState<string | null>(null)
	const [shareBalance, setShareBalance] = useState<string | null>(null)
	const [sharesMinted, setSharesMinted] = useState<string | null>(null)
	const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")

	const handleDeposit = async () => {
		if (!address || !depositAmount) return
		setStatus("loading")
		try {
			const stroops = BigInt(Math.floor(Number(depositAmount) * 10_000_000))
			const tx = await vault.deposit(
				{ assets: stroops, receiver: address, from: address, operator: address },
				// @ts-expect-error publicKey is allowed
				{ publicKey: address },
			)
			const result = await tx.signAndSend({ signTransaction })
			const minted = result.result?.toString() ?? "0"
			setSharesMinted((Number(minted) / 10_000_000).toFixed(7))
			setStatus("idle")
			setDepositAmount("")
			await updateBalances()
			await refreshBalances()
		} catch (err) {
			console.error("Deposit failed:", err)
			setStatus("error")
		}
	}

	const handleWithdraw = async () => {
		if (!address || !withdrawAmount) return
		setStatus("loading")
		try {
			const stroops = BigInt(Math.floor(Number(withdrawAmount) * 10_000_000))
			const tx = await vault.withdraw(
				{ assets: stroops, receiver: address, owner: address, operator: address },
				// @ts-expect-error publicKey is allowed
				{ publicKey: address },
			)
			await tx.signAndSend({ signTransaction })
			setStatus("idle")
			setWithdrawAmount("")
			await updateBalances()
			await refreshBalances()
		} catch (err) {
			console.error("Withdraw failed:", err)
			setStatus("error")
		}
	}

	const refreshBalances = async () => {
		try {
			const { result: totalAssets } = await vault.total_assets()
			const xlm = Number(totalAssets) / 10_000_000
			setVaultBalance(xlm.toFixed(7))
		} catch (err) {
			console.error("Get total_assets failed:", err)
			setVaultBalance("0")
		}

		if (address) {
			try {
				const { result: shares } = await vault.share_balance({ owner: address })
				const shareXlm = Number(shares) / 10_000_000
				setShareBalance(shareXlm.toFixed(7))
			} catch (err) {
				console.error("Get share_balance failed:", err)
				setShareBalance("0")
			}
		}
	}

	return (
		<Card>
			<h2>XLM Vault (ERC-4626)</h2>

			<p data-testid="vault-balance">
				Vault total assets: {vaultBalance !== null ? `${vaultBalance} XLM` : "—"}
			</p>

			<p data-testid="share-balance">
				Your share balance: {shareBalance !== null ? `${shareBalance} vXLM` : "—"}
			</p>

			{sharesMinted !== null && (
				<p data-testid="shares-minted">
					Shares minted: {sharesMinted} vXLM
				</p>
			)}

			<div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
				<Input
					id="deposit-amount"
					fieldSize="md"
					placeholder="Deposit amount (XLM)"
					value={depositAmount}
					data-testid="deposit-input"
					onChange={(e) => setDepositAmount(e.target.value)}
				/>

				<Button
					variant="primary"
					size="md"
					data-testid="deposit-btn"
					disabled={!address || !depositAmount || status === "loading"}
					onClick={handleDeposit}
				>
					{status === "loading" ? "Signing…" : "Deposit"}
				</Button>
			</div>

			<div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginTop: "1rem" }}>
				<Input
					id="withdraw-amount"
					fieldSize="md"
					placeholder="Withdraw amount (XLM)"
					value={withdrawAmount}
					data-testid="withdraw-input"
					onChange={(e) => setWithdrawAmount(e.target.value)}
				/>

				<Button
					variant="primary"
					size="md"
					data-testid="withdraw-btn"
					disabled={!address || !withdrawAmount || status === "loading"}
					onClick={handleWithdraw}
				>
					{status === "loading" ? "Signing…" : "Withdraw"}
				</Button>
			</div>

			<div style={{ marginTop: "1rem" }}>
				<Button
					variant="secondary"
					size="md"
					data-testid="refresh-balance-btn"
					onClick={refreshBalances}
				>
					Refresh Balances
				</Button>
			</div>

			{status === "error" && (
				<p data-testid="vault-error" style={{ color: "red" }}>
					Transaction failed. Check console for details.
				</p>
			)}
		</Card>
	)
}
