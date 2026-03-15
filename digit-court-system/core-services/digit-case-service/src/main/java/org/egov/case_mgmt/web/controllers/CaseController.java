package org.egov.case_mgmt.web.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/case")
public class CaseController {
    @GetMapping("/v1/_search")
    public ResponseEntity<Map<String, Object>> search() {
        return ResponseEntity.ok(new HashMap<>());
    }

}

    

         

        

        

        

        

        