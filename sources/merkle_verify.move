module merkle_verify::merkle {
    use std::string::{Self as string};
    use std::vector;
    use std::hash;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const InvalidProof: u64 = 2;
    const ERootMisMatched: u64 = 1;
    const ENotOwner: u64 = 3;

    struct MerkleVerifier has key {
        id: UID,
        expected_root: vector<u8>,
        owner: address
    }

    fun init(ctx: &mut TxContext) {
        let merkle_verifier = MerkleVerifier {
            id: object::new(ctx),
            expected_root: vector::empty(),
            owner: tx_context::sender(ctx)
        };
        transfer::share_object(merkle_verifier);
    }

    public fun set_expected_root(merkle_verifier: &mut MerkleVerifier, new_root: vector<u8>, ctx: &TxContext) {
        assert!(merkle_verifier.owner == tx_context::sender(ctx), ENotOwner);
        merkle_verifier.expected_root = new_root;
    }

    public fun verify_merkle(merkle_verifier: &MerkleVerifier, leaf: vector<u8>, merkle_hashes: vector<vector<u8>>, merkle_directions: vector<u8>): bool { 
        let merkle_length = vector::length(&merkle_hashes);
        let i = 0;
        let hash_data = leaf;
        let vec_tree = vector::empty<u8>();
        while (i < merkle_length) {
            let merkle_data = *vector::borrow(&merkle_hashes, i);
            let merkle_direction = *vector::borrow(&merkle_directions, i);
            if (merkle_direction == 0) {
                let merkle_data_left = merkle_data;
                vector::append(&mut vec_tree, merkle_data_left);
                vector::append(&mut vec_tree, hash_data);                
                hash_data = hash::sha2_256(vec_tree);
                vec_tree = vector::empty<u8>();
            } else if (merkle_direction == 1) {
                vector::append(&mut vec_tree, hash_data);
                vector::append(&mut vec_tree, merkle_data);
                hash_data = hash::sha2_256(vec_tree);
                vec_tree = vector::empty<u8>();
            } else {
                abort InvalidProof
            };
            i = i + 1;
        };
        hash_data == merkle_verifier.expected_root
    }
}
