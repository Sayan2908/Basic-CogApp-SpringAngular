package com.example.helloworld.controller;

import com.example.helloworld.model.Policy;
import com.example.helloworld.model.User;
import com.example.helloworld.repository.PolicyRepository;
import com.example.helloworld.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/v1")
public class ApiController {

    private final UserRepository userRepository;
    private final PolicyRepository policyRepository;

    public ApiController(UserRepository userRepository, PolicyRepository policyRepository) {
        this.userRepository = userRepository;
        this.policyRepository = policyRepository;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/policies/{id}")
    public ResponseEntity<Policy> getPolicyById(@PathVariable Long id) {
        Optional<Policy> policy = policyRepository.findById(id);

        return policy.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/policies")
    public List<Policy> getAllPolicies() {
        return policyRepository.findAll();
    }

    @PostMapping("/users")
    public User addUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PostMapping("/policies")
    public Policy addPolicy(@RequestBody Policy policy) {
        return policyRepository.save(policy);
    }
}