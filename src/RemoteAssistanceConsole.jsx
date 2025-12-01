import React, { useState, useMemo } from 'react';
import { MapPin, Radio, Zap, AlertCircle, Users, User, Navigation, Eye, Package } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map clicks for relocate mode and fleet blocker placement
const MapClickHandler = ({ interventionMode, isFleetMode, selectedMapAction, onMapClick, onFleetBlockerClick }) => {
  useMapEvents({
    click: (e) => {
      if (interventionMode === 'relocate') {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      } else if (isFleetMode && selectedMapAction) {
        onFleetBlockerClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

const RemoteAssistanceConsole = () => {
  const [selectedTicket, setSelectedTicket] = useState('AV-2847');
  const [interventionMode, setInterventionMode] = useState('draw');
  const [selectedReason, setSelectedReason] = useState('');
  const [activeCamera, setActiveCamera] = useState('front');
  const [pathPoints, setPathPoints] = useState([]);
  const [selectedNudgeAction, setSelectedNudgeAction] = useState('');
  const [newPickupLocation, setNewPickupLocation] = useState(null);
  const [isFleetMode, setIsFleetMode] = useState(false);
  const [selectedMapAction, setSelectedMapAction] = useState(null);
  const [fleetBlockerLocation, setFleetBlockerLocation] = useState(null);

  // Quick Actions state
  const [waitForInstructions, setWaitForInstructions] = useState(false);
  const [hazardsOn, setHazardsOn] = useState(false);

  // Assignee management state
  const [showConfirmTakeModal, setShowConfirmTakeModal] = useState(false);

  const [tickets, setTickets] = useState([
    { 
      id: 'AV-2847', 
      vehicleId: 'RT-4521', 
      timeStalled: '00:45', 
      priority: 'high',
      context: 'Pax Waiting',
      status: 'Pickup Location Issue',
      assignedTo: 'You',
      assignedOperator: 'Sarah K.',
      scenario: 'pickup_mismatch',
      issue: 'Pax unable to locate vehicle',
      location: 'Civic Center Plaza',
      notes: 'Pin shows north side, vehicle on south entrance'
    },
    { 
      id: 'AV-2848', 
      vehicleId: 'RT-3309', 
      timeStalled: '00:12', 
      priority: 'medium',
      context: 'Pax Waiting',
      status: 'Complex Navigation',
      assignedTo: 'other',
      assignedOperator: 'Mike T.',
      scenario: 'construction',
      issue: 'Construction zone - needs routing',
      location: '5th St between Market & Mission',
      notes: 'Multiple lane closures, unclear detour signage'
    },
    { 
      id: 'AV-2849', 
      vehicleId: 'ND-7856', 
      timeStalled: '02:34', 
      priority: 'low',
      context: 'Empty',
      status: 'Route Blocked',
      assignedTo: null,
      assignedOperator: null,
      scenario: 'event_closure',
      issue: 'Street closed - marathon event',
      location: 'Embarcadero & Bay St',
      notes: 'City marathon in progress, road closure until 2pm'
    },
    { 
      id: 'AV-2850', 
      vehicleId: 'RT-2190', 
      timeStalled: '00:08', 
      priority: 'high',
      context: 'Pax Onboard',
      status: 'Traffic Merge',
      assignedTo: null,
      assignedOperator: null,
      scenario: 'traffic',
      issue: 'Unable to merge into traffic',
      location: 'I-280 Onramp at King St',
      notes: 'Heavy traffic, waiting for safe merge opportunity'
    }
  ]);

  const reasons = [
    'Construction Zone',
    'Road Debris',
    'Unclear Lane Markings',
    'Event Closure (Marathon/Parade)',
    'Pickup Location Mismatch',
    'Narrow Passage',
    'Heavy Traffic Merge',
    'Other Obstruction'
  ];

  const currentTicket = tickets.find(t => t.id === selectedTicket);

  // Custom Leaflet icons - memoized to prevent recreation on every render
  const vehicleIcon = useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#39FF14" stroke="#000" stroke-width="2"/>
        <path d="M12 6 L12 2 L10 5 L14 5 Z" fill="#39FF14"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }), []);

  const passengerIcon = useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
        <path d="M12 0 C7 0 3 4 3 9 C3 14 12 24 12 24 S21 14 21 9 C21 4 17 0 12 0 Z" fill="#FF9500" stroke="#000" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="4" fill="#000"/>
      </svg>
    `),
    iconSize: [24, 32],
    iconAnchor: [12, 32],
  }), []);

  const oldPickupIcon = useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
        <path d="M12 0 C7 0 3 4 3 9 C3 14 12 24 12 24 S21 14 21 9 C21 4 17 0 12 0 Z" fill="#FF3B30" stroke="#000" stroke-width="1.5" opacity="0.5"/>
        <line x1="7" y1="5" x2="17" y2="13" stroke="#fff" stroke-width="2"/>
        <line x1="17" y1="5" x2="7" y2="13" stroke="#fff" stroke-width="2"/>
      </svg>
    `),
    iconSize: [24, 32],
    iconAnchor: [12, 32],
  }), []);

  const newPickupIcon = useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 0 C8 0 3 5 3 11 C3 17 14 28 14 28 S25 17 25 11 C25 5 20 0 14 0 Z" fill="#39FF14" stroke="#000" stroke-width="2"/>
        <circle cx="14" cy="11" r="5" fill="#000"/>
      </svg>
    `),
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  }), []);

  const fleetBlockerIcon = useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0 C10 0 4 6 4 13 C4 20 16 32 16 32 S28 20 28 13 C28 6 22 0 16 0 Z" fill="#FF3B30" stroke="#000" stroke-width="2"/>
        <circle cx="16" cy="13" r="6" fill="#fff"/>
        <path d="M16 7 L16 19 M10 13 L22 13" stroke="#FF3B30" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `),
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  }), []);

  // San Francisco coordinates (Civic Center area)
  const mapCenter = [37.7797, -122.4184];
  const vehiclePosition = [37.7797, -122.4184];
  const passengerPosition = currentTicket?.scenario === 'pickup_mismatch'
    ? [37.7785, -122.4195]
    : [37.7805, -122.4170];
  const oldPickupPosition = [37.7810, -122.4165];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#5AC8FA';
      default: return '#8E8E93';
    }
  };

  const getContextColor = (context) => {
    if (context === 'Pax Onboard') return '#FF3B30';
    if (context === 'Pax Waiting') return '#FF9500';
    if (context === 'Delivery') return '#5AC8FA';
    return '#8E8E93';
  };

  const handleSendCommand = () => {
    if (isFleetMode && selectedMapAction && fleetBlockerLocation) {
      const actionNames = {
        'road_closure': 'mark this road as CLOSED',
        'hazard': 'report a HAZARD on this road',
        'construction': 'mark this area as a CONSTRUCTION ZONE'
      };
      const confirmed = window.confirm(
        `⚠️ FLEET-WIDE CHANGE\n\n` +
        `You are about to ${actionNames[selectedMapAction]}.\n\n` +
        `Location: ${fleetBlockerLocation[0].toFixed(6)}, ${fleetBlockerLocation[1].toFixed(6)}\n\n` +
        `This will affect 12 other vehicles in the fleet.\n\n` +
        `Reason: ${selectedReason}\n\n` +
        `Are you sure you want to proceed?`
      );
      if (confirmed) {
        alert(`✓ Fleet map updated: ${selectedMapAction}\n12 vehicles rerouted`);
        setSelectedMapAction(null);
        setFleetBlockerLocation(null);
      }
    } else if (interventionMode === 'draw' && pathPoints.length > 0) {
      alert(`Sending path with ${pathPoints.length} waypoints to ${currentTicket?.vehicleId}`);
      setPathPoints([]);
    } else if (interventionMode === 'nudge' && selectedNudgeAction) {
      const actionNames = {
        'pull_over': 'Pull Over Safely',
        'proceed_slowly': 'Proceed Slowly (5 mph)',
        'wait': 'Wait for Clear Signal',
        'resume': 'Resume Normal Speed',
        'move_left': 'Move Left 2 ft',
        'move_right': 'Move Right 2 ft'
      };
      alert(`Sending "${actionNames[selectedNudgeAction]}" to ${currentTicket?.vehicleId}`);
      setSelectedNudgeAction('');
    } else if (interventionMode === 'relocate' && newPickupLocation) {
      alert(`Updating pickup pin for ${currentTicket?.vehicleId}`);
      setNewPickupLocation(null);
    }
  };

  // Quick Action handlers
  const handleQuickAction = (action) => {
    switch(action) {
      case 'wait':
        setWaitForInstructions(!waitForInstructions);
        alert(`${!waitForInstructions ? '⏸️ Vehicle holding position' : '▶️ Vehicle released from hold'} - ${currentTicket?.vehicleId}`);
        break;
      case 'honk':
        alert(`🔊 Honk sent to ${currentTicket?.vehicleId}`);
        break;
      case 'hazards':
        setHazardsOn(!hazardsOn);
        alert(`${!hazardsOn ? '🚨 Hazards ON' : '✓ Hazards OFF'} - ${currentTicket?.vehicleId}`);
        break;
      case 'flash_lights':
        alert(`💡 Flash lights command sent to ${currentTicket?.vehicleId}`);
        break;
      default:
        break;
    }
  };

  // Assignee management handlers
  const handleTakeTask = () => {
    if (!currentTicket) return;

    // Check if task is already assigned to someone else
    if (currentTicket.assignedTo === 'other') {
      setShowConfirmTakeModal(true);
    } else {
      // Task is open, automatically take it
      updateTicketAssignment(currentTicket.id, 'You', 'Sarah K.');
      alert(`✓ Task ${currentTicket.id} assigned to you`);
    }
  };

  const handleConfirmTakeFromOther = () => {
    if (!currentTicket) return;

    const previousAssignee = currentTicket.assignedOperator;
    updateTicketAssignment(currentTicket.id, 'You', 'Sarah K.');
    setShowConfirmTakeModal(false);
    alert(`✓ Task ${currentTicket.id} reassigned to you (was: ${previousAssignee})`);
  };

  const handleReleaseTask = () => {
    if (!currentTicket) return;

    updateTicketAssignment(currentTicket.id, null, null);
    alert(`✓ Task ${currentTicket.id} released and marked as open`);
  };

  const updateTicketAssignment = (ticketId, assignedTo, assignedOperator) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, assignedTo, assignedOperator }
          : ticket
      )
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#ffffff',
      overflow: 'hidden'
    }}>
      
      {/* Column 1: Queue (20%) */}
      <div style={{
        width: '20%',
        borderRight: '1px solid #2d2d2d',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #2d2d2d',
          backgroundColor: '#0f0f0f'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Radio size={18} color="#39FF14" />
            Active Interventions
          </h2>
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#8e8e93',
            display: 'flex',
            gap: '12px'
          }}>
            <span>{tickets.filter(t => !t.assignedTo).length} open</span>
            <span style={{ color: '#5e5e5e' }}>•</span>
            <span>{tickets.filter(t => t.assignedTo === 'You').length} yours</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket.id)}
              style={{
                padding: '16px',
                borderBottom: '1px solid #2d2d2d',
                cursor: 'pointer',
                backgroundColor: selectedTicket === ticket.id ? '#2d2d2d' : 'transparent',
                borderLeft: selectedTicket === ticket.id ? '3px solid #39FF14' : '3px solid transparent',
                transition: 'all 0.2s ease',
                opacity: ticket.assignedTo === 'other' ? 0.6 : 1
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>
                  {ticket.vehicleId}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: ticket.timeStalled.startsWith('00:0') ? '#FF9500' : '#FF3B30',
                  fontFamily: 'monospace'
                }}>
                  {ticket.timeStalled}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: getContextColor(ticket.context),
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {ticket.context === 'Pax Onboard' ? <Users size={10} /> : 
                   ticket.context === 'Pax Waiting' ? <User size={10} /> :
                   ticket.context === 'Delivery' ? <Package size={10} /> : null}
                  {ticket.context}
                </span>
                
                {ticket.assignedTo === 'You' && (
                  <span style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#39FF14',
                    color: '#000000',
                    fontWeight: 600
                  }}>
                    Yours
                  </span>
                )}
                {ticket.assignedTo === 'other' && (
                  <span style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#5E5E5E',
                    color: '#ffffff',
                    fontWeight: 600
                  }}>
                    {ticket.assignedOperator}
                  </span>
                )}
                {!ticket.assignedTo && (
                  <span style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #5AC8FA',
                    color: '#5AC8FA',
                    fontWeight: 600
                  }}>
                    Open
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '11px',
                color: '#8e8e93',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getPriorityColor(ticket.priority)
                }} />
                {ticket.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Stage (60%) */}
      <div style={{
        width: '60%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Status Bar */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#FF3B30',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              Vehicle State: Paused - {currentTicket?.status}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#39FF14',
                boxShadow: '0 0 6px #39FF14'
              }} />
              <span>47ms</span>
            </div>
            <span>{currentTicket?.vehicleId} • {currentTicket?.timeStalled} elapsed</span>
          </div>
        </div>

        {/* Context Panel */}
        {currentTicket && (
          <div style={{
            padding: '12px 24px',
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #3d3d3d',
            display: 'flex',
            gap: '20px',
            fontSize: '12px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#8e8e93', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
                Issue
              </div>
              <div style={{ color: '#ffffff', fontWeight: 500 }}>
                {currentTicket.issue}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#8e8e93', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
                Location
              </div>
              <div style={{ color: '#ffffff', fontWeight: 500 }}>
                {currentTicket.location}
              </div>
            </div>
            <div style={{ flex: 1.5 }}>
              <div style={{ color: '#8e8e93', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
                Notes
              </div>
              <div style={{ color: '#FF9500', fontWeight: 500, fontStyle: 'italic' }}>
                {currentTicket.notes}
              </div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid #3d3d3d', paddingLeft: '20px' }}>
              <div style={{ color: '#8e8e93', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
                Assignee
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {currentTicket.assignedTo === 'You' && (
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#39FF14',
                      color: '#000000',
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      Yours
                    </span>
                  )}
                  {currentTicket.assignedTo === 'other' && (
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#5E5E5E',
                      color: '#ffffff',
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      {currentTicket.assignedOperator}
                    </span>
                  )}
                  {!currentTicket.assignedTo && (
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #5AC8FA',
                      color: '#5AC8FA',
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      Open
                    </span>
                  )}
                </div>
                <div>
                  {currentTicket.assignedTo !== 'You' && (
                    <button
                      onClick={handleTakeTask}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#5AC8FA',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Take Task
                    </button>
                  )}
                  {currentTicket.assignedTo === 'You' && (
                    <button
                      onClick={handleReleaseTask}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FF9500',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Release Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Camera Selector */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#0f0f0f',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#8e8e93',
            marginRight: '8px',
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            Camera:
          </div>
          {['front', 'rear', 'left', 'right', 'interior'].map((camera) => (
            <button
              key={camera}
              onClick={() => setActiveCamera(camera)}
              style={{
                padding: '6px 14px',
                backgroundColor: activeCamera === camera ? '#39FF14' : '#2d2d2d',
                color: activeCamera === camera ? '#000000' : '#ffffff',
                border: activeCamera === camera ? 'none' : '1px solid #3d3d3d',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {camera}
            </button>
          ))}
          <div style={{
            marginLeft: 'auto',
            fontSize: '10px',
            color: '#8e8e93',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#FF3B30',
              animation: 'pulse 2s infinite'
            }} />
            All cameras live
          </div>
        </div>

        {/* Video Feed + Map */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '1px',
          backgroundColor: '#0f0f0f',
          overflow: 'hidden'
        }}>
          {/* Video Feed (70%) */}
          <div style={{
            width: '70%',
            height: '100%',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Breadcrumb Waypoints */}
            {interventionMode === 'draw' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'crosshair',
                  zIndex: 20
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  setPathPoints(prev => [...prev, { x, y }]);
                }}
              >
                <svg style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}>
                  {pathPoints.map((point, i) => {
                    if (i === 0) return null;
                    return (
                      <line
                        key={i}
                        x1={pathPoints[i-1].x}
                        y1={pathPoints[i-1].y}
                        x2={point.x}
                        y2={point.y}
                        stroke="#39FF14"
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        opacity="0.7"
                      />
                    );
                  })}
                </svg>

                {pathPoints.map((point, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: point.x,
                      top: point.y,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{
                      width: i === 0 || i === pathPoints.length - 1 ? '24px' : '16px',
                      height: i === 0 || i === pathPoints.length - 1 ? '24px' : '16px',
                      backgroundColor: '#39FF14',
                      border: '3px solid #000000',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#000000',
                      boxShadow: '0 0 12px rgba(57, 255, 20, 0.6)'
                    }}>
                      {i + 1}
                    </div>
                    {i === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#39FF14',
                        color: '#000000',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}>
                        START
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {interventionMode === 'draw' && pathPoints.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(57, 255, 20, 0.95)',
                color: '#000000',
                padding: '16px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textAlign: 'center',
                zIndex: 15,
                pointerEvents: 'none',
                border: '2px solid #000000'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
                Click to place waypoints
              </div>
            )}

            {interventionMode === 'draw' && pathPoints.length > 0 && (
              <button
                onClick={() => setPathPoints([])}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '8px 16px',
                  backgroundColor: '#FF3B30',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 25
                }}
              >
                🗑️ Clear
              </button>
            )}

            {/* Camera indicator */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '8px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              zIndex: 10
            }}>
              <Eye size={14} color="#39FF14" />
              <span style={{ textTransform: 'capitalize' }}>{activeCamera} Camera • Live</span>
            </div>

            {/* Center placeholder */}
            <div style={{ textAlign: 'center', opacity: 0.3, zIndex: 1 }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {activeCamera === 'front' ? '📹' :
                 activeCamera === 'rear' ? '🔄' :
                 activeCamera === 'left' ? '⬅️' :
                 activeCamera === 'right' ? '➡️' : '👁️'}
              </div>
              <div style={{ fontSize: '14px', color: '#8e8e93', textTransform: 'capitalize' }}>
                {activeCamera} Camera Feed
              </div>
            </div>

            {/* Scenario overlays */}
            {activeCamera === 'front' && currentTicket?.scenario === 'construction' && (
              <>
                <div style={{
                  position: 'absolute',
                  top: '35%',
                  left: '25%',
                  width: '150px',
                  height: '80px',
                  border: '2px solid #FF9500',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 149, 0, 0.1)',
                  zIndex: 5
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '0',
                    backgroundColor: '#FF9500',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 600
                  }}>
                    Barrier
                  </div>
                </div>
              </>
            )}

            {activeCamera === 'front' && currentTicket?.scenario === 'event_closure' && (
              <div style={{
                position: 'absolute',
                top: '30%',
                left: '10%',
                right: '10%',
                height: '100px',
                border: '3px solid #FF3B30',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 59, 48, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 5
              }}>
                <div style={{ fontSize: '32px' }}>🚧</div>
                <div style={{
                  backgroundColor: '#FF3B30',
                  padding: '6px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  Road Closed - Marathon
                </div>
              </div>
            )}

            {/* Detection Info */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '11px',
              borderLeft: '3px solid #39FF14',
              zIndex: 10
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                {activeCamera === 'front' ? 'LiDAR Detection: Active' : 
                 activeCamera === 'interior' ? 'Interior Monitoring' : 
                 `${activeCamera} Sensors: Active`}
              </div>
              <div style={{ color: '#8e8e93' }}>
                {currentTicket?.scenario === 'construction' && '2 obstacles detected'}
                {currentTicket?.scenario === 'pickup_mismatch' && 'Check map for location'}
                {currentTicket?.scenario === 'event_closure' && 'Road closure detected'}
              </div>
            </div>
          </div>

          {/* Map (30%) */}
          <div
            style={{
              width: '30%',
              height: '100%',
              backgroundColor: '#0f0f0f',
              position: 'relative',
              borderLeft: '1px solid #2d2d2d',
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              scrollWheelZoom={true}
              dragging={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Map click handler for relocate mode and fleet blocker placement */}
              <MapClickHandler
                interventionMode={interventionMode}
                isFleetMode={isFleetMode}
                selectedMapAction={selectedMapAction}
                onMapClick={(latlng) => setNewPickupLocation(latlng)}
                onFleetBlockerClick={(latlng) => setFleetBlockerLocation(latlng)}
              />

              {/* Vehicle marker */}
              <Marker position={vehiclePosition} icon={vehicleIcon}>
                <Popup>
                  <div style={{ color: '#000' }}>
                    <strong>{currentTicket?.vehicleId}</strong><br/>
                    Status: {currentTicket?.status}
                  </div>
                </Popup>
              </Marker>

              {/* Passenger marker */}
              {currentTicket?.context === 'Pax Waiting' && (
                <Marker position={passengerPosition} icon={passengerIcon}>
                  <Popup>
                    <div style={{ color: '#000' }}>
                      <strong>Passenger</strong><br/>
                      Waiting for pickup
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Old pickup pin */}
              {(interventionMode === 'relocate' || currentTicket?.scenario === 'pickup_mismatch') && currentTicket?.context === 'Pax Waiting' && (
                <Marker position={oldPickupPosition} icon={oldPickupIcon}>
                  <Popup>
                    <div style={{ color: '#000' }}>
                      <strong>Old Pickup Location</strong><br/>
                      Incorrect pin placement
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* New pickup location */}
              {interventionMode === 'relocate' && newPickupLocation && (
                <Marker position={newPickupLocation} icon={newPickupIcon}>
                  <Popup>
                    <div style={{ color: '#000' }}>
                      <strong>New Pickup Location</strong><br/>
                      Click "Send Command" to update
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Fleet blocker location */}
              {isFleetMode && selectedMapAction && fleetBlockerLocation && (
                <Marker position={fleetBlockerLocation} icon={fleetBlockerIcon}>
                  <Popup>
                    <div style={{ color: '#000' }}>
                      <strong>Fleet Blocker Location</strong><br/>
                      {selectedMapAction === 'road_closure' && 'Road Closure'}
                      {selectedMapAction === 'hazard' && 'Hazard'}
                      {selectedMapAction === 'construction' && 'Construction Zone'}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Clear pin button for relocate mode */}
            {interventionMode === 'relocate' && newPickupLocation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNewPickupLocation(null);
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 12px',
                  backgroundColor: '#FF3B30',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 1000
                }}
              >
                Clear Pin
              </button>
            )}

            {/* Clear pin button for fleet blocker */}
            {isFleetMode && selectedMapAction && fleetBlockerLocation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFleetBlockerLocation(null);
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 12px',
                  backgroundColor: '#FF3B30',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 1000
                }}
              >
                Clear Pin
              </button>
            )}

            {/* Location label */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: (interventionMode === 'relocate' && newPickupLocation) || (isFleetMode && selectedMapAction && fleetBlockerLocation) ? '100px' : '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              borderLeft: `3px solid ${isFleetMode && selectedMapAction ? '#FF3B30' : '#39FF14'}`,
              zIndex: 1000,
              pointerEvents: 'none'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                {currentTicket?.location}
              </div>
              <div style={{ fontSize: '9px', color: isFleetMode && selectedMapAction ? '#FF3B30' : interventionMode === 'relocate' ? '#39FF14' : '#8e8e93' }}>
                {isFleetMode && selectedMapAction ? 'Click map to place blocker pin' :
                 interventionMode === 'relocate' ? 'Click map to set pickup location' :
                 currentTicket?.context === 'Pax Waiting' ? 'En route to pickup' :
                 currentTicket?.context === 'Pax Onboard' ? 'En route to destination' :
                 'Autonomous navigation'}
              </div>
            </div>

            {/* Map legend */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '9px',
              lineHeight: '1.6',
              zIndex: 1000,
              pointerEvents: 'none'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#8e8e93', textTransform: 'uppercase' }}>
                Map Legend
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#39FF14', borderRadius: '50%' }} />
                  <span style={{ color: '#ffffff' }}>Vehicle</span>
                </div>
                {currentTicket?.context === 'Pax Waiting' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#FF9500', borderRadius: '50%' }} />
                    <span style={{ color: '#ffffff' }}>Passenger</span>
                  </div>
                )}
                {interventionMode === 'relocate' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', backgroundColor: '#FF3B30', borderRadius: '50%', opacity: 0.5 }} />
                      <span style={{ color: '#ffffff', textDecoration: 'line-through' }}>Old Pin</span>
                    </div>
                    {newPickupLocation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', backgroundColor: '#39FF14', borderRadius: '50%' }} />
                        <span style={{ color: '#39FF14', fontWeight: 600 }}>New Pin</span>
                      </div>
                    )}
                  </>
                )}
                {isFleetMode && selectedMapAction && fleetBlockerLocation && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#FF3B30', borderRadius: '50%' }} />
                    <span style={{ color: '#FF3B30', fontWeight: 600 }}>Blocker Pin</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Controls (20%) */}
      <div style={{
        width: '20%',
        borderLeft: isFleetMode ? '3px solid #FF3B30' : '1px solid #2d2d2d',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: isFleetMode ? '#1a0a0a' : 'transparent'
      }}>
        {/* Fleet Mode Toggle */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2d2d2d',
          backgroundColor: isFleetMode ? '#2d1010' : '#0f0f0f'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '11px',
            fontWeight: 600,
            color: '#8e8e93',
            textTransform: 'uppercase'
          }}>
            Control Scope
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => {
                setIsFleetMode(false);
                setSelectedMapAction(null);
                setFleetBlockerLocation(null);
              }}
              style={{
                padding: '8px 10px',
                backgroundColor: !isFleetMode ? '#5AC8FA' : '#2d2d2d',
                color: !isFleetMode ? '#000000' : '#ffffff',
                border: !isFleetMode ? '2px solid #000000' : '1px solid #3d3d3d',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚗 Vehicle
            </button>
            <button
              onClick={() => setIsFleetMode(true)}
              style={{
                padding: '8px 10px',
                backgroundColor: isFleetMode ? '#FF3B30' : '#2d2d2d',
                color: '#ffffff',
                border: isFleetMode ? '2px solid #000000' : '1px solid #3d3d3d',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🗺️ Fleet
            </button>
          </div>
          {isFleetMode && (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'rgba(255, 59, 48, 0.2)',
              border: '1px solid #FF3B30',
              borderRadius: '4px',
              fontSize: '9px',
              color: '#FF9500',
              fontWeight: 600
            }}>
              ⚠️ FLEET MODE: Affects ALL vehicles
            </div>
          )}
        </div>

        {/* Vehicle Mode Tools */}
        {!isFleetMode && (
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#8e8e93',
              textTransform: 'uppercase'
            }}>
              Quick Actions
            </h3>

            {/* Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '20px' }}>
              {/* Wait for Instructions - State-based */}
              <button
                onClick={() => handleQuickAction('wait')}
                style={{
                  padding: '10px 8px',
                  backgroundColor: waitForInstructions ? '#FF9500' : '#2d2d2d',
                  color: '#ffffff',
                  border: waitForInstructions ? '2px solid #000000' : '1px solid #3d3d3d',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '16px' }}>⏸️</span>
                <span>Wait</span>
                {waitForInstructions && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#39FF14',
                    borderRadius: '50%',
                    border: '1px solid #000',
                    boxShadow: '0 0 6px #39FF14'
                  }} />
                )}
              </button>

              {/* Honk - Single event */}
              <button
                onClick={() => handleQuickAction('honk')}
                style={{
                  padding: '10px 8px',
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                  border: '1px solid #3d3d3d',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '16px' }}>🔊</span>
                <span>Honk</span>
              </button>

              {/* Hazards - State-based */}
              <button
                onClick={() => handleQuickAction('hazards')}
                style={{
                  padding: '10px 8px',
                  backgroundColor: hazardsOn ? '#FF3B30' : '#2d2d2d',
                  color: '#ffffff',
                  border: hazardsOn ? '2px solid #000000' : '1px solid #3d3d3d',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '16px' }}>🚨</span>
                <span>Hazards</span>
                {hazardsOn && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#39FF14',
                    borderRadius: '50%',
                    border: '1px solid #000',
                    boxShadow: '0 0 6px #39FF14',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </button>

              {/* Flash Lights - Single event */}
              <button
                onClick={() => handleQuickAction('flash_lights')}
                style={{
                  padding: '10px 8px',
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                  border: '1px solid #3d3d3d',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '16px' }}>💡</span>
                <span>Flash</span>
              </button>
            </div>

            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#8e8e93',
              textTransform: 'uppercase'
            }}>
              Vehicle Commands
            </h3>

            {/* Mode buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  setInterventionMode('draw');
                  setSelectedNudgeAction('');
                  setNewPickupLocation(null);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: interventionMode === 'draw' ? '#39FF14' : '#2d2d2d',
                  color: interventionMode === 'draw' ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Navigation size={14} />
                <div style={{ fontSize: '10px', marginTop: '2px' }}>Draw Path</div>
              </button>
              <button
                onClick={() => {
                  setInterventionMode('nudge');
                  setPathPoints([]);
                  setNewPickupLocation(null);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: interventionMode === 'nudge' ? '#39FF14' : '#2d2d2d',
                  color: interventionMode === 'nudge' ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Zap size={14} />
                <div style={{ fontSize: '10px', marginTop: '2px' }}>Nudge</div>
              </button>
              <button
                onClick={() => {
                  setInterventionMode('relocate');
                  setPathPoints([]);
                  setSelectedNudgeAction('');
                }}
                style={{
                  padding: '10px',
                  backgroundColor: interventionMode === 'relocate' ? '#39FF14' : '#2d2d2d',
                  color: interventionMode === 'relocate' ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  gridColumn: 'span 2'
                }}
              >
                <MapPin size={14} />
                <div style={{ fontSize: '10px', marginTop: '2px' }}>Relocate Pickup</div>
              </button>
            </div>

            {/* Nudge actions */}
            {interventionMode === 'nudge' && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#8e8e93',
                  textTransform: 'uppercase'
                }}>
                  Select Action
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'pull_over', label: 'Pull Over Safely', icon: '🛑' },
                    { id: 'proceed_slowly', label: 'Proceed Slowly (5 mph)', icon: '🐌' },
                    { id: 'wait', label: 'Wait for Clear Signal', icon: '⏸️' },
                    { id: 'resume', label: 'Resume Normal Speed', icon: '▶️' },
                    { id: 'move_left', label: 'Move Left 2 ft', icon: '⬅️' },
                    { id: 'move_right', label: 'Move Right 2 ft', icon: '➡️' }
                  ].map(action => (
                    <button
                      key={action.id}
                      onClick={() => setSelectedNudgeAction(action.id)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: selectedNudgeAction === action.id ? '#39FF14' : '#2d2d2d',
                        color: selectedNudgeAction === action.id ? '#000000' : '#ffffff',
                        border: selectedNudgeAction === action.id ? '2px solid #000000' : '1px solid #3d3d3d',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason dropdown */}
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#8e8e93',
              textTransform: 'uppercase'
            }}>
              Incident Reason
            </h3>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2d2d2d',
                color: '#ffffff',
                border: '1px solid #3d3d3d',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              <option value="">Select reason...</option>
              {reasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
        )}

        {/* Fleet Mode Tools */}
        {isFleetMode && (
          <div style={{ padding: '20px', flex: 1 }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#FF9500',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              ⚠️ Map Edits (All Vehicles)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {[
                { id: 'road_closure', label: 'Mark Road Closed', subtitle: 'Block segment for fleet', icon: '🚧' },
                { id: 'hazard', label: 'Report Hazard', subtitle: 'Slow zone for all', icon: '⚠️' },
                { id: 'construction', label: 'Construction Zone', subtitle: 'Reduce speed for all', icon: '🏗️' }
              ].map(action => (
                <button
                  key={action.id}
                  onClick={() => setSelectedMapAction(action.id)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedMapAction === action.id ? '#FF3B30' : '#2d2d2d',
                    color: '#ffffff',
                    border: selectedMapAction === action.id ? '2px solid #000000' : '1px solid #3d3d3d',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{action.icon}</span>
                  <div>
                    <div>{action.label}</div>
                    <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>
                      {action.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Reason dropdown */}
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#8e8e93',
              textTransform: 'uppercase'
            }}>
              Incident Reason
            </h3>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2d2d2d',
                color: '#ffffff',
                border: '1px solid #3d3d3d',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              <option value="">Select reason...</option>
              {reasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
        )}

        {/* Send button */}
        <div style={{ padding: '20px', backgroundColor: '#0f0f0f' }}>
          <button
            disabled={!selectedReason ||
                     (!isFleetMode && interventionMode === 'draw' && pathPoints.length === 0) ||
                     (!isFleetMode && interventionMode === 'nudge' && !selectedNudgeAction) ||
                     (!isFleetMode && interventionMode === 'relocate' && !newPickupLocation) ||
                     (isFleetMode && (!selectedMapAction || !fleetBlockerLocation))}
            onClick={handleSendCommand}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: (selectedReason && ((isFleetMode && selectedMapAction && fleetBlockerLocation) ||
                (!isFleetMode && ((interventionMode === 'draw' && pathPoints.length > 0) ||
                (interventionMode === 'nudge' && selectedNudgeAction) ||
                (interventionMode === 'relocate' && newPickupLocation)))))
                ? (isFleetMode ? '#FF3B30' : '#39FF14') : '#2d2d2d',
              color: (selectedReason && ((isFleetMode && selectedMapAction && fleetBlockerLocation) ||
                (!isFleetMode && ((interventionMode === 'draw' && pathPoints.length > 0) ||
                (interventionMode === 'nudge' && selectedNudgeAction) ||
                (interventionMode === 'relocate' && newPickupLocation)))))
                ? (isFleetMode ? '#ffffff' : '#000000') : '#666666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: (selectedReason && ((isFleetMode && selectedMapAction && fleetBlockerLocation) ||
                (!isFleetMode && ((interventionMode === 'draw' && pathPoints.length > 0) ||
                (interventionMode === 'nudge' && selectedNudgeAction) ||
                (interventionMode === 'relocate' && newPickupLocation))))) ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase'
            }}
          >
            {isFleetMode ? '⚠️ Update Fleet Map' : 'Send Command'}
          </button>
          <div style={{
            marginTop: '12px',
            fontSize: '10px',
            color: '#8e8e93',
            textAlign: 'center'
          }}>
            {isFleetMode ? (!selectedMapAction ? 'Select action above' : !fleetBlockerLocation ? 'Click map to place pin' : '⚠️ Requires confirmation') :
             !selectedReason ? 'Select reason first' :
             interventionMode === 'draw' && pathPoints.length === 0 ? 'Place waypoints on video' :
             interventionMode === 'nudge' && !selectedNudgeAction ? 'Select action above' :
             interventionMode === 'relocate' && !newPickupLocation ? 'Click map to set location' :
             'Ready to send'}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmTakeModal && currentTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#2d2d2d',
            border: '2px solid #FF9500',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '16px',
              color: '#FF9500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ Confirm Task Reassignment
            </div>
            <div style={{
              fontSize: '14px',
              color: '#ffffff',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              This task is currently assigned to <strong style={{ color: '#FF9500' }}>{currentTicket.assignedOperator}</strong>.
              <br /><br />
              Are you sure you want to take this task from them?
            </div>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowConfirmTakeModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#5E5E5E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTakeFromOther}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#5AC8FA',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Yes, Take Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        select option {
          background-color: #2d2d2d;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default RemoteAssistanceConsole;
