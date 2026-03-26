#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env};

#[contract]
pub struct Counter;

#[contractimpl]
impl Counter {
    /// Increment the counter by 1 and return the new value.
    pub fn increment(env: &Env) -> u32 {
        let count: u32 = env
            .storage()
            .instance()
            .get(&symbol_short!("COUNT"))
            .unwrap_or(0);
        let new_count = count + 1;
        env.storage()
            .instance()
            .set(&symbol_short!("COUNT"), &new_count);
        new_count
    }

    /// Read the current count without modifying state.
    pub fn get_count(env: &Env) -> u32 {
        env.storage()
            .instance()
            .get(&symbol_short!("COUNT"))
            .unwrap_or(0)
    }
}
