import { Card, Icon } from "@stellar/design-system"
import React from "react"
import { Link } from "react-router-dom"
import { Counter } from "../components/Counter"
import { Vault } from "../components/Vault"
import { labPrefix } from "../contracts/util"
import styles from "./Home.module.css"

const Home: React.FC = () => (
	<div className={styles.Home}>
		<div>
			<h1>Test dApp</h1>
			<p>
				A test application for verifying wallet-mock E2E testing against
				Soroban contracts (Counter + XLM Vault).
			</p>
		</div>

		<Counter />
		<Vault />

		<section>
			<Card>
				<Icon.Code02 size="lg" />
				<p>
					Invoke your smart contract using the
					<Link to="/debug" className="Link Link--primary">
						Contract Explorer
					</Link>
				</p>
			</Card>

			<Card>
				<Icon.SearchLg size="lg" />
				<p>
					Browse your local transactions with the
					<Link to={labPrefix()} className="Link Link--primary">
						Transaction Explorer
					</Link>
				</p>
			</Card>
		</section>
	</div>
)

export default Home
