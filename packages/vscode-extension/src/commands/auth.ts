import * as vscode from 'vscode';
import { ApiClient } from '../utils/ApiClient';

const apiClient = new ApiClient();

export async function login() {
  console.log('🔑 Starting login process...');

  const email = await vscode.window.showInputBox({ 
    prompt: 'Enter your email',
    placeHolder: 'user@example.com'
  });
  if (!email) {
    console.log('❌ Login cancelled: No email provided');
    return;
  }

  const password = await vscode.window.showInputBox({
    prompt: 'Enter your password',
    password: true,
  });
  if (!password) {
    console.log('❌ Login cancelled: No password provided');
    return;
  }

  console.log(`🔄 Attempting login with email: ${email}`);
  vscode.window.showInformationMessage('Logging in...');

  try {
    const response = await apiClient.login(email, password);
    console.log('📡 Login response received:', response);

    if (response && response.session && response.session.access_token) {
      await vscode.workspace.getConfiguration('codingHabitTracker').update(
        'authToken', 
        response.session.access_token, 
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage('✅ Successfully logged in!');
      console.log('✅ Login successful - token stored');
    } else {
      vscode.window.showErrorMessage('❌ Login failed. Invalid response from server.');
      console.log('❌ Login failed: Invalid response structure', response);
    }
  } catch (error) {
    vscode.window.showErrorMessage('❌ Login error. Check console for details.');
    console.error('💥 Login error:', error);
  }
}

export async function logout() {
  await vscode.workspace.getConfiguration('codingHabitTracker').update('authToken', undefined, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage('✅ Successfully logged out.');
  console.log('✅ User logged out');
}

export async function checkAuthStatus() {
  const config = vscode.workspace.getConfiguration('codingHabitTracker');
  const token = await config.get('authToken');
  
  if (token) {
    vscode.window.showInformationMessage(`✅ You are logged in. Token: ${(token as string).substring(0, 20)}...`);
    console.log('✅ User is authenticated');
  } else {
    vscode.window.showWarningMessage('❌ You are not logged in. Please use the Login command.');
    console.log('❌ User is not authenticated');
  }
}

export async function testBackendConnection() {
  console.log('🔄 Testing backend connection...');
  vscode.window.showInformationMessage('Testing backend connection...');
  
  try {
    const isHealthy = await apiClient.checkHealth();
    if (isHealthy) {
      vscode.window.showInformationMessage('✅ Backend connection successful!');
      console.log('✅ Backend is healthy');
    } else {
      vscode.window.showErrorMessage('❌ Backend unhealthy. Check if server is running on http://localhost:3001');
      console.log('❌ Backend health check failed');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`❌ Cannot connect to backend: ${error}`);
    console.error('💥 Backend connection error:', error);
  }
} 