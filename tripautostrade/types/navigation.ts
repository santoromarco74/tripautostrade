import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AreaServizio } from '../data/areeServizio';

export type RootStackParamList = {
  Home: undefined;
  Reviews: { area: AreaServizio };
  AddReview: { area: AreaServizio };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Reviews'>;
export type AddReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'AddReview'>;
