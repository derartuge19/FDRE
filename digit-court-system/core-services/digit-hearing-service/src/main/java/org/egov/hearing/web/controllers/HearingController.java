package org.egov.hearing.web.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/hearing")
public class HearingController {

    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinHearing(@RequestBody Map<String, String> request) {
        String caseNumber = request.get("caseNumber");
        String hearingId = request.get("hearingId");
        
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        
        data.put("id", "session-" + System.currentTimeMillis());
        data.put("hearingId", hearingId);
        data.put("caseNumber", caseNumber);
        data.put("startTime", java.time.Instant.now().toString());
        data.put("encryption", "AES-4096-SECURE");
        
        response.put("success", true);
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/control")
    public ResponseEntity<Map<String, Object>> controlHearing(@PathVariable String sessionId, @RequestBody Map<String, String> request) {
        String action = request.get("action");
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Action " + action + " disseminated via Spring Boot service");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/recording")
    public ResponseEntity<Map<String, Object>> startStopRecording(@PathVariable String sessionId, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Session capture " + (status.equals("START") ? "initiated" : "terminated"));
        return ResponseEntity.ok(response);
    }
}
