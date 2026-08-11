import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, X } from 'lucide-react';
import { relationships } from '../../data/archive';
import { characters } from '../../data/characters';
import { CharacterImageViewer } from '../../components/CharacterImageViewer';
import { ImagePlaceholder } from '../../components/ImagePlaceholder';
import { getCharacterImageStyle, getCharacterImageUrl } from '../../utils/characterImages';
import type { Organization, Relationship } from '../../types';

const ORGANIZATION_ORDER: Organization[] = [
  'LADER',
  'PACTUM',
  'UNKNOWN',
  'ORIA',
  'EASTER',
  'NIVALI',
  'SOLARIA',
];

const ORGANIZATION_COLORS: Record<Organization, string> = {
  LADER: '#62C5FF',
  PACTUM: '#3DE4FF',
  UNKNOWN: '#7794FF',
  ORIA: '#42D2E6',
  EASTER: '#5FAEFF',
  NIVALI: '#9AE7FF',
  SOLARIA: '#438FFF',
};

const NETWORK_WIDTH = 2600;
const NETWORK_HEIGHT = 1900;
const PAN_MARGIN = 140;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.65;
const ZOOM_STEP = 0.15;

const RELATIONSHIP_LABELS: Record<string, string> = {
  'aira:kim-jihyun': '구조 · 협력',
  'setsuna:sora': '친한 관계',
  'setsuna:sui': '파견 · 협력',
};

const UNIQUE_RELATIONSHIPS = relationships.filter((relationship, index, entries) => {
  const key = [relationship.source, relationship.target].sort().join(':');
  return entries.findIndex((candidate) => (
    [candidate.source, candidate.target].sort().join(':') === key
  )) === index;
});

function relationshipKey(relationship: Relationship) {
  return [relationship.source, relationship.target].sort().join(':');
}

function getOrganizationHubPosition(index: number) {
  const angle = -Math.PI / 2 + (index / ORGANIZATION_ORDER.length) * Math.PI * 2;
  return {
    angle,
    x: 50 + Math.cos(angle) * 21,
    y: 50 + Math.sin(angle) * 22,
  };
}

function getMemberBranchPosition(organizationIndex: number, index: number, count: number) {
  const hub = getOrganizationHubPosition(organizationIndex);
  const spread = count <= 1 ? 0 : Math.min(0.68, 0.18 * (count - 1));
  const offset = count <= 1 ? 0 : -spread / 2 + (index / (count - 1)) * spread;
  const angle = hub.angle + offset;
  const distance = count >= 4 && index % 2 === 1 ? 23 : 19;

  return {
    x: hub.x + Math.cos(angle) * distance,
    y: hub.y + Math.sin(angle) * distance * 0.9,
  };
}

function getRelationshipImageStyle(characterId: string): React.CSSProperties {
  return {
    ...getCharacterImageStyle(characterId, 0),
    imageRendering: 'auto',
    backfaceVisibility: 'hidden',
  };
}

export default function ArchiveRelationships() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isViewportReady, setIsViewportReady] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const organizationHubRefs = useRef(new Map<Organization, HTMLDivElement>());
  const zoomRef = useRef(1);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStateRef = useRef<{
    pointerIds: [number, number];
    startDistance: number;
    startZoom: number;
    contentX: number;
    contentY: number;
  } | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const organizationGroups = useMemo(() => ORGANIZATION_ORDER.map((organization) => ({
    organization,
    members: characters.filter((character) => character.organization === organization),
  })), []);

  const selectedCharacter = selectedCharacterId
    ? characters.find((character) => character.id === selectedCharacterId) ?? null
    : null;
  const selectedCharacterRelationships = selectedCharacterId
    ? UNIQUE_RELATIONSHIPS.filter((relationship) => (
        relationship.source === selectedCharacterId || relationship.target === selectedCharacterId
      ))
    : [];

  const clampPan = useCallback((position: { x: number; y: number }, zoomLevel = zoomRef.current) => {
    const viewport = viewportRef.current;
    if (!viewport) return position;
    const scaledWidth = NETWORK_WIDTH * zoomLevel;
    const scaledHeight = NETWORK_HEIGHT * zoomLevel;
    return {
      x: Math.min(PAN_MARGIN, Math.max(viewport.clientWidth - scaledWidth - PAN_MARGIN, position.x)),
      y: Math.min(PAN_MARGIN, Math.max(viewport.clientHeight - scaledHeight - PAN_MARGIN, position.y)),
    };
  }, []);

  const centerNetwork = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const zoomLevel = zoomRef.current;
    setPan({
      x: (viewport.clientWidth - NETWORK_WIDTH * zoomLevel) / 2,
      y: (viewport.clientHeight - NETWORK_HEIGHT * zoomLevel) / 2,
    });
    setIsViewportReady(true);
  }, []);

  const zoomAtPoint = useCallback((requestedZoom: number, clientX?: number, clientY?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const previousZoom = zoomRef.current;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, requestedZoom));
    if (Math.abs(nextZoom - previousZoom) < 0.001) return;

    const bounds = viewport.getBoundingClientRect();
    const anchorX = clientX === undefined ? bounds.width / 2 : clientX - bounds.left;
    const anchorY = clientY === undefined ? bounds.height / 2 : clientY - bounds.top;

    setPan((position) => clampPan({
      x: anchorX - ((anchorX - position.x) / previousZoom) * nextZoom,
      y: anchorY - ((anchorY - position.y) / previousZoom) * nextZoom,
    }, nextZoom));
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  }, [clampPan]);

  useLayoutEffect(() => {
    centerNetwork();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resizeObserver = new ResizeObserver(() => {
      setPan((position) => clampPan(position));
    });
    resizeObserver.observe(viewport);
    return () => resizeObserver.disconnect();
  }, [centerNetwork, clampPan]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (event.pointerType === 'touch') {
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      event.currentTarget.setPointerCapture(event.pointerId);

      const pointers = Array.from(activePointersRef.current.entries());
      if (pointers.length >= 2) {
        const [[firstId, first], [secondId, second]] = pointers.slice(-2);
        const viewportBounds = event.currentTarget.getBoundingClientRect();
        const centerX = (first.x + second.x) / 2 - viewportBounds.left;
        const centerY = (first.y + second.y) / 2 - viewportBounds.top;
        pinchStateRef.current = {
          pointerIds: [firstId, secondId],
          startDistance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
          startZoom: zoomRef.current,
          contentX: (centerX - pan.x) / zoomRef.current,
          contentY: (centerY - pan.y) / zoomRef.current,
        };
        dragStateRef.current = null;
        setIsDragging(true);
        return;
      }
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' && activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const pinchState = pinchStateRef.current;
      if (pinchState) {
        const first = activePointersRef.current.get(pinchState.pointerIds[0]);
        const second = activePointersRef.current.get(pinchState.pointerIds[1]);
        if (!first || !second) return;

        const viewportBounds = event.currentTarget.getBoundingClientRect();
        const centerX = (first.x + second.x) / 2 - viewportBounds.left;
        const centerY = (first.y + second.y) / 2 - viewportBounds.top;
        const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
        const nextZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, pinchState.startZoom * (distance / pinchState.startDistance)),
        );

        setPan(clampPan({
          x: centerX - pinchState.contentX * nextZoom,
          y: centerY - pinchState.contentY * nextZoom,
        }, nextZoom));
        zoomRef.current = nextZoom;
        setZoom(nextZoom);
        setIsDragging(true);
        return;
      }
    }

    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) < 4) return;

    dragState.moved = true;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setIsDragging(true);
    setPan(clampPan({
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY,
    }));
  };

  const finishDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (event.pointerType === 'touch') {
      activePointersRef.current.delete(event.pointerId);
      const pinchState = pinchStateRef.current;
      if (pinchState?.pointerIds.includes(event.pointerId)) {
        pinchStateRef.current = null;
        dragStateRef.current = null;
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        setIsDragging(false);
        return;
      }
    }

    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (dragState.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomFactor = Math.exp(-event.deltaY * 0.0012);
      zoomAtPoint(zoomRef.current * zoomFactor, event.clientX, event.clientY);
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [zoomAtPoint]);

  const drawNetwork = useCallback(() => {
    const container = networkRef.current;
    const canvas = canvasRef.current;
    const core = coreRef.current;
    if (!container || !canvas || !core) return;

    const bounds = container.getBoundingClientRect();
    const renderedScale = Math.max(0.001, bounds.width / NETWORK_WIDTH);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = NETWORK_WIDTH;
    const height = NETWORK_HEIGHT;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const coreBounds = core.getBoundingClientRect();
    const corePoint = {
      x: (coreBounds.left - bounds.left + coreBounds.width / 2) / renderedScale,
      y: (coreBounds.top - bounds.top + coreBounds.height / 2) / renderedScale,
    };

    ORGANIZATION_ORDER.forEach((organization) => {
      const hub = organizationHubRefs.current.get(organization);
      if (!hub) return;
      const hubBounds = hub.getBoundingClientRect();
      const hubPoint = {
        x: (hubBounds.left - bounds.left + hubBounds.width / 2) / renderedScale,
        y: (hubBounds.top - bounds.top + hubBounds.height / 2) / renderedScale,
      };
      const accent = ORGANIZATION_COLORS[organization];

      context.save();
      context.beginPath();
      context.moveTo(corePoint.x, corePoint.y);
      context.lineTo(hubPoint.x, hubPoint.y);
      context.setLineDash([4, 7]);
      context.lineWidth = 1.35;
      context.globalAlpha = 0.48;
      context.strokeStyle = accent;
      context.shadowColor = accent;
      context.shadowBlur = 8;
      context.stroke();

      const coreDistance = Math.hypot(hubPoint.x - corePoint.x, hubPoint.y - corePoint.y);
      const junctionCount = Math.max(2, Math.floor(coreDistance / 70));
      for (let index = 1; index < junctionCount; index += 1) {
        const progress = index / junctionCount;
        const x = corePoint.x + (hubPoint.x - corePoint.x) * progress;
        const y = corePoint.y + (hubPoint.y - corePoint.y) * progress;
        context.beginPath();
        context.arc(x, y, 1.5, 0, Math.PI * 2);
        context.fillStyle = accent;
        context.globalAlpha = 0.7;
        context.fill();
      }
      context.restore();

      const members = characters.filter((character) => character.organization === organization);
      members.forEach((character) => {
        const memberNode = nodeRefs.current.get(character.id);
        if (!memberNode) return;
        const memberBounds = memberNode.getBoundingClientRect();
        const memberPoint = {
          x: (memberBounds.left - bounds.left + memberBounds.width / 2) / renderedScale,
          y: (memberBounds.top - bounds.top + memberBounds.height / 2) / renderedScale - 12,
        };
        const selected = selectedCharacterId === character.id;
        const involved = selectedRel
          ? selectedRel.source === character.id || selectedRel.target === character.id
          : false;
        const branchAngle = Math.atan2(memberPoint.y - hubPoint.y, memberPoint.x - hubPoint.x);
        const start = {
          x: hubPoint.x + Math.cos(branchAngle) * 51,
          y: hubPoint.y + Math.sin(branchAngle) * 51,
        };
        const end = {
          x: memberPoint.x - Math.cos(branchAngle) * 40,
          y: memberPoint.y - Math.sin(branchAngle) * 40,
        };

        context.save();
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.setLineDash([]);
        context.lineWidth = selected || involved ? 2 : 1.1;
        context.globalAlpha = selected || involved ? 0.94 : 0.44;
        context.strokeStyle = accent;
        context.shadowColor = accent;
        context.shadowBlur = selected || involved ? 12 : 5;
        context.stroke();

        const splitX = start.x + (end.x - start.x) * 0.52;
        const splitY = start.y + (end.y - start.y) * 0.52;
        context.beginPath();
        context.arc(splitX, splitY, selected || involved ? 2.3 : 1.7, 0, Math.PI * 2);
        context.globalAlpha = selected || involved ? 1 : 0.7;
        context.fillStyle = accent;
        context.fill();
        context.restore();
      });
    });

    UNIQUE_RELATIONSHIPS.forEach((relationship) => {
      const sourceNode = nodeRefs.current.get(relationship.source);
      const targetNode = nodeRefs.current.get(relationship.target);
      const sourceCharacter = characters.find((character) => character.id === relationship.source);
      const targetCharacter = characters.find((character) => character.id === relationship.target);
      if (!sourceNode || !targetNode || !sourceCharacter || !targetCharacter) return;

      const sourceBounds = sourceNode.getBoundingClientRect();
      const targetBounds = targetNode.getBoundingClientRect();
      const source = {
        x: (sourceBounds.left - bounds.left + sourceBounds.width / 2) / renderedScale,
        y: (sourceBounds.top - bounds.top + sourceBounds.height / 2) / renderedScale - 12,
      };
      const target = {
        x: (targetBounds.left - bounds.left + targetBounds.width / 2) / renderedScale,
        y: (targetBounds.top - bounds.top + targetBounds.height / 2) / renderedScale - 12,
      };
      const key = relationshipKey(relationship);
      const activeRelationship = selectedRel ? relationshipKey(selectedRel) === key : false;
      const activeCharacter = selectedCharacterId === relationship.source
        || selectedCharacterId === relationship.target;
      const highlighted = activeRelationship || activeCharacter;
      const crossOrganization = sourceCharacter.organization !== targetCharacter.organization;
      const sourceColor = ORGANIZATION_COLORS[sourceCharacter.organization];
      const targetColor = ORGANIZATION_COLORS[targetCharacter.organization];
      const gradient = context.createLinearGradient(source.x, source.y, target.x, target.y);
      gradient.addColorStop(0, sourceColor);
      gradient.addColorStop(1, targetColor);

      context.save();
      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.setLineDash(crossOrganization ? [8, 7] : []);
      context.lineWidth = highlighted ? 2.4 : 1.35;
      context.globalAlpha = highlighted ? 1 : 0.68;
      context.strokeStyle = gradient;
      context.shadowColor = '#55D5FF';
      context.shadowBlur = highlighted ? 16 : 9;
      context.stroke();

      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const arrowX = target.x - Math.cos(angle) * 48;
      const arrowY = target.y - Math.sin(angle) * 48;
      const arrowSize = highlighted ? 8 : 6;
      context.setLineDash([]);
      context.beginPath();
      context.moveTo(arrowX, arrowY);
      context.lineTo(
        arrowX - Math.cos(angle - Math.PI / 6) * arrowSize,
        arrowY - Math.sin(angle - Math.PI / 6) * arrowSize,
      );
      context.lineTo(
        arrowX - Math.cos(angle + Math.PI / 6) * arrowSize,
        arrowY - Math.sin(angle + Math.PI / 6) * arrowSize,
      );
      context.closePath();
      context.fillStyle = targetColor;
      context.fill();

      const label = RELATIONSHIP_LABELS[key] ?? '관계 확인';
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      context.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
      const textWidth = context.measureText(label).width;
      const labelWidth = textWidth + 16;
      const labelHeight = 20;
      context.globalAlpha = 1;
      context.shadowBlur = 10;
      context.shadowColor = 'rgba(45, 195, 255, 0.5)';
      context.fillStyle = 'rgba(3, 14, 24, 0.94)';
      context.fillRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight);
      context.shadowBlur = 0;
      context.strokeStyle = highlighted ? '#7DE4FF' : '#2E7798';
      context.lineWidth = 1;
      context.strokeRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight);
      context.fillStyle = highlighted ? '#DDF8FF' : '#8ECDE5';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, midX, midY + 0.5);
      context.restore();
    });
  }, [selectedCharacterId, selectedRel]);

  useEffect(() => {
    const container = networkRef.current;
    if (!container) return;

    const frameId = window.requestAnimationFrame(drawNetwork);
    const delayedFrameId = window.setTimeout(drawNetwork, 250);
    const resizeObserver = new ResizeObserver(drawNetwork);
    resizeObserver.observe(container);
    window.addEventListener('resize', drawNetwork);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(delayedFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawNetwork);
    };
  }, [drawNetwork]);

  const selectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId);
    const firstRelationship = UNIQUE_RELATIONSHIPS.find((relationship) => (
      relationship.source === characterId || relationship.target === characterId
    ));
    setSelectedRel(firstRelationship ?? null);
  };

  const closeCharacterDetails = () => {
    setSelectedCharacterId(null);
    setSelectedRel(null);
  };

  useEffect(() => {
    if (!selectedCharacterId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCharacterDetails();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedCharacterId]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <header className="mb-6 border-b border-[#23506D] pb-5">
        <div className="mb-3 flex items-center gap-2 font-mono text-[9px] tracking-[0.24em] text-[#43C7FF]">
          <span className="h-1.5 w-1.5 bg-[#43C7FF] shadow-[0_0_9px_rgba(67,199,255,0.9)]" />
          AETHER SOCIAL NETWORK ONLINE
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-widest text-white sm:text-4xl">RELATIONSHIPS</h1>
            <p className="text-sm text-[#899BAB]">중앙 코어에서 조직과 인물로 뻗어나가는 홀로그램 관계 분기망</p>
          </div>
          <div className="flex gap-4 font-mono text-[9px] tracking-[0.16em] text-[#6F899D] sm:text-[10px]">
            <span><b className="text-[#75D9FF]">07</b> GROUPS</span>
            <span><b className="text-[#75D9FF]">{String(characters.length).padStart(2, '0')}</b> PEOPLE</span>
            <span><b className="text-[#75D9FF]">{String(UNIQUE_RELATIONSHIPS.length).padStart(2, '0')}</b> RELATIONS</span>
          </div>
        </div>
      </header>

      <div className="mb-4 flex flex-nowrap items-center gap-5 overflow-x-auto border border-[#193A51] bg-[#06111D]/70 px-3 py-3 font-mono text-[8px] tracking-[0.12em] text-[#70899C] [scrollbar-width:none] sm:flex-wrap sm:px-4 sm:text-[9px] sm:tracking-[0.14em]">
        <span className="flex items-center gap-2">
          <span className="w-7 border-t border-dashed border-[#3B91B8]" /> 조직 계통
        </span>
        <span className="flex items-center gap-2">
          <span className="h-px w-7 bg-[#4FCBFF]/60" /> 소속 가지
        </span>
        <span className="flex items-center gap-2">
          <span className="h-px w-7 bg-[#7BE1FF] shadow-[0_0_7px_rgba(79,203,255,0.9)]" /> 확인된 개인 관계
        </span>
        <span>인물 사진을 선택하면 관계가 강조됩니다.</span>
      </div>

      <div
        ref={viewportRef}
        role="application"
        aria-label="드래그하여 탐색하는 인물 관계도"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        className={`relative h-[calc(100svh-230px)] min-h-[500px] select-none overflow-hidden border border-[#173F59] bg-[#020912]/80 sm:h-[clamp(620px,72vh,780px)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none' }}
      >
        <div
          ref={networkRef}
          className="absolute left-0 top-0 overflow-hidden transition-opacity duration-300"
          style={{
            width: NETWORK_WIDTH,
            height: NETWORK_HEIGHT,
            transform: `translate(${Math.round(pan.x)}px, ${Math.round(pan.y)}px) scale(${zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            opacity: isViewportReady ? 1 : 0,
            backgroundImage: [
              'linear-gradient(rgba(45, 174, 230, 0.075) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(45, 174, 230, 0.075) 1px, transparent 1px)',
              'radial-gradient(circle at 50% 50%, rgba(25, 142, 201, 0.16), transparent 36%)',
              'radial-gradient(circle at center, #071827 0%, #020912 72%)',
            ].join(', '),
            backgroundSize: '54px 54px, 54px 54px, 100% 100%, 100% 100%',
          }}
        >
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-20" aria-hidden="true" />

          <div
            ref={coreRef}
            className="absolute left-1/2 top-1/2 z-[30] flex h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#4BCBFF]/75 bg-[#041421]/95 text-center shadow-[0_0_42px_rgba(75,203,255,0.3)]"
          >
            <div className="absolute inset-[-10px] animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-[#3C9FC7]/40" />
            <div className="absolute inset-[-20px] animate-[spin_30s_linear_infinite_reverse] rounded-full border border-[#2E779A]/20" />
            <div>
              <div className="font-mono text-[10px] tracking-[0.15em] text-[#62D8FF]">MANDATUM</div>
              <div className="mt-1.5 font-mono text-[8px] tracking-[0.11em] text-[#638498]">RELATION CORE</div>
            </div>
          </div>

          {organizationGroups.map(({ organization, members }, organizationIndex) => {
            const accent = ORGANIZATION_COLORS[organization];
            const hubPosition = getOrganizationHubPosition(organizationIndex);
            return (
              <React.Fragment key={organization}>
                <div
                  ref={(node) => {
                    if (node) organizationHubRefs.current.set(organization, node);
                    else organizationHubRefs.current.delete(organization);
                  }}
                  className="pointer-events-none absolute z-[30] flex h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-center"
                  style={{
                    top: Math.round((hubPosition.y / 100) * NETWORK_HEIGHT),
                    left: Math.round((hubPosition.x / 100) * NETWORK_WIDTH),
                    color: accent,
                    borderColor: `${accent}A6`,
                    background: `radial-gradient(circle, ${accent}25 0%, rgba(3, 14, 24, 0.97) 68%)`,
                    boxShadow: `0 0 0 8px ${accent}0C, 0 0 25px ${accent}38, inset 0 0 18px ${accent}18`,
                  }}
                >
                  <span
                    className="absolute inset-[-7px] rounded-full border border-dashed"
                    style={{ borderColor: `${accent}3D` }}
                  />
                  <div>
                    <div className="font-mono text-[11px] font-bold tracking-[0.13em]">{organization}</div>
                    <div className="mt-1.5 font-mono text-[8px] tracking-[0.12em] text-[#66859A]">
                      {String(members.length).padStart(2, '0')} NODES
                    </div>
                  </div>
                </div>

                {members.map((character, index) => {
                  const position = getMemberBranchPosition(organizationIndex, index, members.length);
                  const involved = selectedRel
                    ? selectedRel.source === character.id || selectedRel.target === character.id
                    : false;
                  const selected = selectedCharacterId === character.id;
                  const linked = UNIQUE_RELATIONSHIPS.some((relationship) => (
                    relationship.source === character.id || relationship.target === character.id
                  ));

                  return (
                    <button
                      key={character.id}
                      ref={(node) => {
                        if (node) nodeRefs.current.set(character.id, node);
                        else nodeRefs.current.delete(character.id);
                      }}
                      type="button"
                      onClick={() => selectCharacter(character.id)}
                      aria-label={`${character.name} 상세 정보 열기`}
                      className="group pointer-events-auto absolute z-[30] flex w-[132px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6F5FF]"
                      style={{
                        left: Math.round((position.x / 100) * NETWORK_WIDTH),
                        top: Math.round((position.y / 100) * NETWORK_HEIGHT),
                      }}
                    >
                      <div
                        className="relative h-[92px] w-[92px] overflow-hidden rounded-full border-2 bg-[#071724] transition-all duration-200 group-hover:scale-[1.035]"
                        style={{
                          borderColor: selected || involved ? '#D7F7FF' : accent,
                          boxShadow: selected
                            ? `0 0 0 3px ${accent}38, 0 0 24px ${accent}B0`
                            : involved
                              ? `0 0 18px ${accent}78`
                              : `0 0 11px ${accent}42`,
                        }}
                      >
                        <ImagePlaceholder
                          src={getCharacterImageUrl(character.id, 0)}
                          alt={character.name}
                          text={character.name}
                          className="h-full w-full object-cover object-top"
                          imageStyle={getRelationshipImageStyle(character.id)}
                        />
                        {linked && (
                          <span
                            className="absolute right-0 top-0 h-2 w-2 rounded-full border border-[#D8F7FF]"
                            style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
                          />
                        )}
                      </div>
                      <span
                        className="mt-2 max-w-full truncate border px-2.5 py-0.5 text-xs font-bold text-white"
                        style={{
                          borderColor: selected || involved ? `${accent}9C` : 'transparent',
                          backgroundColor: 'rgba(3, 13, 22, 0.88)',
                          textShadow: `0 0 8px ${accent}7A`,
                        }}
                      >
                        {character.name}
                      </span>
                      <span className="mt-1 font-mono text-[8px] tracking-[0.08em] text-[#6E8799]">
                        {character.grade}세대 · {character.pulse.name}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}

        </div>

        <div className="absolute right-3 top-3 z-40 flex border border-[#2B6685] bg-[#041421]/94 font-mono text-[8px] tracking-[0.12em] text-[#80CCE9] shadow-[0_0_18px_rgba(27,139,190,0.16)]">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => zoomAtPoint(zoomRef.current - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM + 0.001}
            aria-label="관계도 축소"
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#123047] hover:text-white disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => zoomAtPoint(1)}
            aria-label={`현재 확대율 ${Math.round(zoom * 100)}%, 100%로 초기화`}
            className="min-w-[52px] border-x border-[#2B6685] px-2 transition-colors hover:bg-[#123047] hover:text-white"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => zoomAtPoint(zoomRef.current + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM - 0.001}
            aria-label="관계도 확대"
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#123047] hover:text-white disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 z-40 border border-[#20465E] bg-[#03101B]/90 px-3 py-2 font-mono text-[8px] tracking-[0.12em] text-[#5E8198] shadow-[0_0_18px_rgba(27,139,190,0.12)] sm:left-4 sm:tracking-[0.14em]">
          <span className="sm:hidden">DRAG · PINCH TO ZOOM</span>
          <span className="hidden sm:inline">DRAG TO NAVIGATE · WHEEL TO ZOOM · SELECT NODE TO TRACE</span>
        </div>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={centerNetwork}
          className="absolute bottom-3 right-4 z-40 border border-[#2B6685] bg-[#041421]/94 px-3 py-2 font-mono text-[8px] tracking-[0.16em] text-[#80CCE9] transition-colors hover:border-[#66D5FF] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#66D5FF]"
        >
          CENTER VIEW
        </button>
      </div>

      <AnimatePresence>
        {selectedCharacter && (
          <motion.div
            key={selectedCharacter.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed inset-0 z-[180]"
          >
            <button
              type="button"
              aria-label="캐릭터 상세 정보 닫기"
              onClick={closeCharacterDetails}
              className="pointer-events-auto absolute inset-0 cursor-default bg-[#01060B]/55 backdrop-blur-[2px]"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="relationship-character-name"
              initial={{ x: '100%' }}
              animate={{ x: 0, transitionEnd: { transform: 'none' } }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 230 }}
              className="pointer-events-auto absolute inset-y-0 right-0 w-full overflow-y-auto border-l border-[#2B6D8D] bg-[#050D16]/98 shadow-[-24px_0_70px_rgba(0,0,0,0.55)] sm:w-[min(1280px,calc(100vw-24px))]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1D4963] bg-[#06111B]/96 px-5 py-4 backdrop-blur-md">
                <span className="font-mono text-[9px] tracking-[0.2em] text-[#59CBF5]">CHARACTER DOSSIER</span>
                <button
                  type="button"
                  onClick={closeCharacterDetails}
                  aria-label="캐릭터 상세 정보 닫기"
                  className="flex h-9 w-9 items-center justify-center border border-[#285A76] text-[#7EA6BA] transition-colors hover:border-[#6BD9FF] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6BD9FF]"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="p-5 sm:p-7">
                <CharacterImageViewer
                  key={selectedCharacter.id}
                  character={selectedCharacter}
                  className="mb-6"
                  borderColor={ORGANIZATION_COLORS[selectedCharacter.organization]}
                />

                <div className="mb-6 border-b border-[#1C3D54] pb-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className="border px-2 py-1 font-mono text-[9px] tracking-[0.15em]"
                      style={{
                        borderColor: ORGANIZATION_COLORS[selectedCharacter.organization],
                        color: ORGANIZATION_COLORS[selectedCharacter.organization],
                      }}
                    >
                      {selectedCharacter.organization}
                    </span>
                    <span className="font-mono text-[10px] text-[#E5727C]">{selectedCharacter.grade}세대</span>
                  </div>
                  <h2 id="relationship-character-name" className="text-3xl font-bold tracking-wide text-white">
                    {selectedCharacter.name}
                  </h2>
                  <p className="mt-2 text-sm text-[#8297A7]">
                    {selectedCharacter.gender} · {selectedCharacter.age}세
                  </p>
                </div>

                <div className="space-y-5">
                  <section>
                    <h3 className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[#5ABFE8]">PULSE</h3>
                    <p className="mb-1 text-lg font-bold text-[#8DDCFA]">{selectedCharacter.pulse.name}</p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#C3CFD7]">{selectedCharacter.pulse.description}</p>
                  </section>
                  <section>
                    <h3 className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[#5ABFE8]">PERSONALITY</h3>
                    <p className="text-sm leading-6 text-[#C3CFD7]">{selectedCharacter.personality}</p>
                  </section>
                  <section>
                    <h3 className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[#5ABFE8]">FEATURES</h3>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#C3CFD7]">{selectedCharacter.features}</p>
                  </section>

                  <section className="border-t border-[#1C3D54] pt-5">
                    <h3 className="mb-3 font-mono text-[9px] tracking-[0.18em] text-[#5ABFE8]">CONFIRMED RELATIONSHIPS</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacterRelationships.length > 0 ? selectedCharacterRelationships.map((relationship) => {
                        const counterpartId = relationship.source === selectedCharacter.id
                          ? relationship.target
                          : relationship.source;
                        const counterpart = characters.find((character) => character.id === counterpartId);
                        const active = selectedRel ? relationshipKey(selectedRel) === relationshipKey(relationship) : false;
                        if (!counterpart) return null;
                        return (
                          <button
                            key={relationshipKey(relationship)}
                            type="button"
                            onClick={() => setSelectedRel(relationship)}
                            className="border px-3 py-2 text-left text-xs transition-colors"
                            style={{
                              borderColor: active ? '#5BD9FF' : '#25475D',
                              color: active ? '#E5FAFF' : '#94AABA',
                              backgroundColor: active ? 'rgba(41, 163, 211, 0.13)' : 'rgba(4, 16, 26, 0.7)',
                            }}
                          >
                            {counterpart.name} · {RELATIONSHIP_LABELS[relationshipKey(relationship)] ?? '관계 확인'}
                          </button>
                        );
                      }) : (
                        <span className="text-sm text-[#718799]">현재 공개된 개인 관계 기록이 없습니다.</span>
                      )}
                    </div>
                    {selectedRel && (
                      <motion.p
                        key={relationshipKey(selectedRel)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 border-l-2 border-[#4FCBFF] bg-[#0A1B28] px-4 py-3 text-sm leading-6 text-[#C1CDD7]"
                      >
                        {selectedRel.description}
                      </motion.p>
                    )}
                  </section>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

