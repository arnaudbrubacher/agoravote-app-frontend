const handlePendingMembersRefresh = (data) => {
  console.log('Handling refresh from PendingMembersList', data);
  
  // Refresh pending members
  fetchPendingMembers();
  fetchInvitedMembers();
  
  // Only refresh the entire group data if preventRedirect is not set
  if (!data || !data.preventRedirect) {
    console.log('Full group refresh requested');
    emit('refresh-group');
  } else {
    console.log('Skip full group refresh to prevent redirect');
    // Instead of refreshing the entire group, fetch only what we need
    fetchDocumentsForActiveMembers();
  }
  
  // If we have data about an approved member, log it
  if (data && data.action === 'approve') {
    console.log(`Member approved: ${data.member.user?.name || 'Unknown member'}`);
  }
} 