module merkle_verify::merkle {
    use std::string::{Self as string};
    use std::vector;
    use std::hash;

    const InvalidProof: u64 = 2;
    const ERootMisMatched: u64 = 1;

    public fun verify_merkle(_root:vector<u8>, leaf: vector<u8>, merkle_hashes: vector<vector<u8>>, merkle_directions: vector<vector<u8>>): vector<u8>{ 
        let merkle_length = vector::length(&merkle_hashes);
        let i = 0;
        let hash_data = leaf;
        let vec_tree = vector::empty<u8>();
        while (i < merkle_length) {
            let merkle_data = *vector::borrow(&merkle_hashes, i);
            let merkle_direction = *vector::borrow(&merkle_directions, i);
            if (string::utf8(merkle_direction) == string::utf8(b"left")){
                let merkle_data_left = merkle_data;
                vector::append(&mut vec_tree, merkle_data_left);
                vector::append(&mut vec_tree, hash_data);                
                hash_data = hash::sha2_256(vec_tree);
                vec_tree = vector::empty<u8>();
            } else if (string::utf8(merkle_direction) == string::utf8(b"right")) {
                vector::append(&mut vec_tree, hash_data );
                vector::append(&mut vec_tree, merkle_data );
                hash_data = hash::sha2_256(vec_tree);
                vec_tree = vector::empty<u8>();
            } else {
                InvalidProof;
            };
            i = i + 1;
        };
        // assert!(root == hash_data, ERootMisMatched);
        hash_data
    }

    #[test] 
    fun test_verify(){
        let merkle_hashes = vector::empty<vector<u8>>();
        let merkle_direction = vector::empty<vector<u8>>();
         
        // for proof 
        vector::push_back(&mut merkle_hashes, x"1ad25d0002690dc02e2708a297d8c9df1f160d376f663309cc261c7c921367e7");
        vector::push_back(&mut merkle_hashes, x"8e302837bc626f037867a860eb81f24568fb0aa9ce754d2ccb58452afe3e3310");
        vector::push_back(&mut merkle_hashes, x"8b56aa54f7553614bf7e355de683ed7c8691a69c67a1bf54e6b2708459138661");

        // for direction 
        vector::push_back(&mut merkle_direction, b"right");
        vector::push_back(&mut merkle_direction, b"left");
        vector::push_back(&mut merkle_direction, b"right");
        let expectedRoot = x"d40db90a4a21b8a28c6c5c8204ae7c378c85485eb333ffd2f06be2981ce9660f";
        let leaf = x"c4289629b08bc4d61411aaa6d6d4a0c3c5f8c1e848e282976e29b6bed5aeedc7";
        let root = verify_merkle(expectedRoot, leaf, merkle_hashes, merkle_direction);
        assert!(expectedRoot == root, 0);
    }

    #[test]
    #[expected_failure] 
    fun test_verify_fails(){
        let merkle_hashes = vector::empty<vector<u8>>();
        let merkle_direction = vector::empty<vector<u8>>();
         
        // for proof 
        vector::push_back(&mut merkle_hashes, x"1ad25d0002690dc02e2708a297d8c9df1f160d376f663309cc261c7c921367e7");
        vector::push_back(&mut merkle_hashes, x"8e302837bc626f037867a860eb81f24568fb0aa9ce754d2ccb58452afe3e3310");
        vector::push_back(&mut merkle_hashes, x"8b56aa54f7553614bf7e355de683ed7c8691a69c67a1bf54e6b2708459138661");

        // for direction 
        vector::push_back(&mut merkle_direction, b"right");
        vector::push_back(&mut merkle_direction, b"left");
        vector::push_back(&mut merkle_direction, b"right");
        let expectedRoot = x"d40db90a4a21b8a28c6c5c8204ae7c378c85485eb333ffd2f06be2981ce96601";
        let leaf = x"c4289629b08bc4d61411aaa6d6d4a0c3c5f8c1e848e282976e29b6bed5aeedc7";
        let root = verify_merkle(expectedRoot, leaf, merkle_hashes, merkle_direction);
        assert!(expectedRoot == root, ERootMisMatched);
    }
}
