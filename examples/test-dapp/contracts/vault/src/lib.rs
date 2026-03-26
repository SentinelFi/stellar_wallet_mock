#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, MuxedAddress, String};
use stellar_access::ownable::{self as ownable, Ownable};
use stellar_tokens::fungible::{Base, FungibleToken};
use stellar_tokens::vault::Vault;

#[contract]
pub struct OZVault;

#[contractimpl]
impl OZVault {
    /// Initialize the vault with an owner and the underlying asset address (native XLM SAC).
    pub fn __constructor(e: &Env, owner: Address, asset_address: Address) {
        ownable::set_owner(e, &owner);
        Base::set_metadata(
            e,
            7,
            String::from_str(e, "Vault Share"),
            String::from_str(e, "vXLM"),
        );
        Vault::set_asset(e, asset_address);
        Vault::set_decimals_offset(e, 0);
    }

    // ─── Vault operations ───

    pub fn deposit(e: &Env, assets: i128, receiver: Address, from: Address, operator: Address) -> i128 {
        Vault::deposit(e, assets, receiver, from, operator)
    }

    pub fn withdraw(e: &Env, assets: i128, receiver: Address, owner: Address, operator: Address) -> i128 {
        Vault::withdraw(e, assets, receiver, owner, operator)
    }

    // ─── Vault queries ───

    pub fn total_assets(e: &Env) -> i128 {
        Vault::total_assets(e)
    }

    pub fn asset(e: &Env) -> Address {
        Vault::query_asset(e)
    }

    pub fn convert_to_shares(e: &Env, assets: i128) -> i128 {
        Vault::convert_to_shares(e, assets)
    }

    pub fn convert_to_assets(e: &Env, shares: i128) -> i128 {
        Vault::convert_to_assets(e, shares)
    }

    pub fn preview_deposit(e: &Env, assets: i128) -> i128 {
        Vault::preview_deposit(e, assets)
    }

    pub fn preview_withdraw(e: &Env, assets: i128) -> i128 {
        Vault::preview_withdraw(e, assets)
    }

    // ─── Share token queries ───

    pub fn share_balance(e: &Env, owner: Address) -> i128 {
        Base::balance(e, &owner)
    }
}

#[contractimpl(contracttrait)]
impl FungibleToken for OZVault {
    type ContractType = Base;
}

#[contractimpl(contracttrait)]
impl Ownable for OZVault {}
