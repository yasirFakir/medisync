package com.medisync.android.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.theme.CanvasBackground

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUsersScreen(
    viewModel: AdminViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var search by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf("ALL") }

    LaunchedEffect(Unit) {
        viewModel.loadUsers()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Users Directory") }) },
        containerColor = CanvasBackground
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {
            TextField(value = search, onValueChange = { search = it }, label = { Text("Search") }, modifier = Modifier.fillMaxWidth())
            Spacer(modifier = Modifier.height(8.dp))
            
            val roles = listOf("ALL", "PATIENT", "DOCTOR", "PHARMACY", "ADMIN")
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(roles) { role ->
                    FilterChip(
                        selected = selectedRole == role,
                        onClick = { selectedRole = role },
                        label = { Text(role) }
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            
            val filteredUsers = uiState.users.filter { 
                (selectedRole == "ALL" || it.role == selectedRole) &&
                (search.isBlank() || it.fullName.contains(search, ignoreCase = true) || it.email.contains(search, ignoreCase = true))
            }

            if (filteredUsers.isEmpty()) {
                Text("No users found", modifier = Modifier.padding(16.dp))
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(filteredUsers) { user ->
                        ElevationCard(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(user.fullName, style = MaterialTheme.typography.titleMedium)
                                Text(user.email, style = MaterialTheme.typography.bodySmall)
                                Row {
                                    Badge { Text(user.role) }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Badge(containerColor = if (user.isActive) Color(0xFF4CAF50) else Color(0xFFF44336)) {
                                        Text(if (user.isActive) "Active" else "Inactive")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
