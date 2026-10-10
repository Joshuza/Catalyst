import type { SurveyFieldsProps } from './FinancialFields';
import { FinancialFields } from './FinancialFields';
import { ScheduleFields } from './ScheduleFields';
import { MobilityFields } from './MobilityFields';
import { LifestyleFields } from './LifestyleFields';
import { ProfileFinance } from '../product/ProfileFinance';
import { ProfileWeek } from '../product/ProfileWeek';
import { ProfileLifestyle } from '../product/ProfileLifestyle';
import { SurveyReview } from './SurveyReview';
import { questions } from './steps';
export function SurveyFields({
  draft,
  patch,
  question,
}: SurveyFieldsProps & { question: string }) {
  const item = questions.find((q) => q.id === question);
  const legacy = item?.legacy;
  const show = (i: number) => i === legacy;
  if (legacy !== undefined)
    return (
      <>
        <ProfileFinance draft={draft} patch={patch} show={show} />
        <ProfileWeek draft={draft} patch={patch} show={show} />
        <ProfileLifestyle draft={draft} patch={patch} show={show} />
      </>
    );
  if (['overhead', 'buffer'].includes(question))
    return <FinancialFields draft={draft} patch={patch} question={question} />;
  if (['persona', 'zoom'].includes(question))
    return <ScheduleFields draft={draft} patch={patch} question={question} />;
  if (['assets', 'walking', 'transit'].includes(question))
    return <MobilityFields draft={draft} patch={patch} question={question} />;
  if (question === 'review') return <SurveyReview draft={draft} />;
  return <LifestyleFields draft={draft} patch={patch} question={question} />;
}
