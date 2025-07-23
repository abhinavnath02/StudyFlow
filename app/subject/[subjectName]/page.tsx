'use client';
import { StudyFlowApp } from '@/components/study/study-flow-app';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';


export default function SubjectPage() {
    const params = useParams();
    const subjectName = Array.isArray(params.subjectName) ? params.subjectName[0] : params.subjectName;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StudyFlowApp subjectName={decodeURIComponent(subjectName)} />
        </Suspense>
    )
}
